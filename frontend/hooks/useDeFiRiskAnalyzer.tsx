"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";
import { DeFiRiskAnalyzerABI } from "@/abi/DeFiRiskAnalyzerABI";
import { DeFiRiskAnalyzerAddresses } from "@/abi/DeFiRiskAnalyzerAddresses";

export type ClearResult = {
  riskScore?: bigint;
  riskLevel?: bigint; // 0,1,2
  stable?: bigint;
  bluechip?: bigint;
  highRisk?: bigint;
};

type ContractInfo = {
  abi: typeof DeFiRiskAnalyzerABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getByChainId(chainId: number | undefined): ContractInfo {
  if (!chainId) {
    return { abi: DeFiRiskAnalyzerABI.abi };
  }
  const chainIdStr = chainId.toString();
  const entry = (DeFiRiskAnalyzerAddresses as Record<string, { address: string; chainId: number; chainName?: string } | undefined>)[chainIdStr];
  if (!entry || !entry.address || entry.address === ethers.ZeroAddress) {
    return { abi: DeFiRiskAnalyzerABI.abi, chainId };
  }
  return {
    address: entry.address as `0x${string}`,
    chainId: entry.chainId ?? chainId,
    chainName: entry.chainName,
    abi: DeFiRiskAnalyzerABI.abi,
  };
}

export const useDeFiRiskAnalyzer = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [handles, setHandles] = useState<{
    riskScore?: string;
    riskLevel?: string;
    stable?: string;
    bluechip?: string;
    highRisk?: string;
  }>({});
  const [clear, setClear] = useState<ClearResult>({});
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  const [inputAssets, setInputAssets] = useState<string>("");
  const [inputRiskPref, setInputRiskPref] = useState<string>("");
  const [inputPositionVol, setInputPositionVol] = useState<string>("");

  const contractRef = useRef<ContractInfo | undefined>(undefined);
  const isBusyRef = useRef<boolean>(isBusy);
  const clearRef = useRef<ClearResult>({});

  const contract = useMemo(() => {
    const c = getByChainId(chainId);
    contractRef.current = c;
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!contract) return undefined;
    return Boolean(contract.address) && contract.address !== ethers.ZeroAddress;
  }, [contract]);

  const canGet = useMemo(() => {
    return contract.address && ethersReadonlyProvider && !isBusy;
  }, [contract.address, ethersReadonlyProvider, isBusy]);

  const refresh = useCallback(() => {
    if (isBusyRef.current) return;
    if (!contractRef.current?.address || !ethersReadonlyProvider) {
      setHandles({});
      return;
    }
    isBusyRef.current = true;
    setIsBusy(true);
    const thisChainId = chainId;
    const addr = contractRef.current.address;
    const c = new ethers.Contract(addr, contractRef.current.abi, ethersReadonlyProvider);
    Promise.resolve()
      .then(async () => {
        const all = await c.getAll();
        const [riskScore, riskLevel, stable, bluechip, highRisk] = all;
        if (sameChain.current(thisChainId)) {
          setHandles({
            riskScore,
            riskLevel,
            stable,
            bluechip,
            highRisk,
          });
        }
      })
      .finally(() => {
        isBusyRef.current = false;
        setIsBusy(false);
      });
  }, [ethersReadonlyProvider, sameChain, chainId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canDecrypt = useMemo(() => {
    return (
      contract.address &&
      instance &&
      ethersSigner &&
      !isBusy &&
      handles.riskScore &&
      handles.riskLevel &&
      handles.stable &&
      handles.bluechip &&
      handles.highRisk
    );
  }, [contract.address, instance, ethersSigner, isBusy, handles]);

  const decryptAll = useCallback(() => {
    if (!contract.address || !instance || !ethersSigner) return;
    if (isBusyRef.current) return;
    const thisAddr = contract.address;
    const thisChainId = chainId;
    const thisSigner = ethersSigner;
    const thisHandles = { ...handles };
    isBusyRef.current = true;
    setIsBusy(true);
    setMessage("Start decrypt...");
    const run = async () => {
      const isStale = () =>
        thisAddr !== contractRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);
      try {
        const sig: FhevmDecryptionSignature | null =
          await FhevmDecryptionSignature.loadOrSign(
            instance,
            [thisAddr],
            thisSigner,
            fhevmDecryptionSignatureStorage
          );
        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }
        if (isStale()) {
          setMessage("Ignore decryption (stale)");
          return;
        }
        setMessage("Call FHEVM userDecrypt...");
        const res = await instance.userDecrypt(
          [
            { handle: thisHandles.riskScore!, contractAddress: thisAddr },
            { handle: thisHandles.riskLevel!, contractAddress: thisAddr },
            { handle: thisHandles.stable!, contractAddress: thisAddr },
            { handle: thisHandles.bluechip!, contractAddress: thisAddr },
            { handle: thisHandles.highRisk!, contractAddress: thisAddr },
          ],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        if (isStale()) {
          setMessage("Ignore decrypted results (stale)");
          return;
        }
        const resRecord = res as Record<string, bigint | undefined>;
        const next: ClearResult = {
          riskScore: typeof resRecord[thisHandles.riskScore!] === 'bigint' ? resRecord[thisHandles.riskScore!] as bigint : undefined,
          riskLevel: typeof resRecord[thisHandles.riskLevel!] === 'bigint' ? resRecord[thisHandles.riskLevel!] as bigint : undefined,
          stable: typeof resRecord[thisHandles.stable!] === 'bigint' ? resRecord[thisHandles.stable!] as bigint : undefined,
          bluechip: typeof resRecord[thisHandles.bluechip!] === 'bigint' ? resRecord[thisHandles.bluechip!] as bigint : undefined,
          highRisk: typeof resRecord[thisHandles.highRisk!] === 'bigint' ? resRecord[thisHandles.highRisk!] as bigint : undefined,
        };
        clearRef.current = next;
        setClear(next);
        setMessage("Decryption completed.");
      } finally {
        isBusyRef.current = false;
        setIsBusy(false);
      }
    };
    run();
  }, [
    contract.address,
    instance,
    ethersSigner,
    chainId,
    handles,
    fhevmDecryptionSignatureStorage,
    sameChain,
    sameSigner,
  ]);

  const canAnalyze = useMemo(() => {
    return (
      contract.address &&
      instance &&
      ethersSigner &&
      !isBusy &&
      inputAssets &&
      inputRiskPref &&
      inputPositionVol
    );
  }, [
    contract.address,
    instance,
    ethersSigner,
    isBusy,
    inputAssets,
    inputRiskPref,
    inputPositionVol,
  ]);

  const analyze = useCallback(() => {
    if (!contract.address || !instance || !ethersSigner) return;
    if (isBusyRef.current) return;
    const thisChainId = chainId;
    const thisAddr = contract.address;
    const thisSigner = ethersSigner;
    isBusyRef.current = true;
    setIsBusy(true);
    setMessage("Encrypt inputs...");
    const run = async () => {
      const isStale = () =>
        thisAddr !== contractRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisSigner);
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const buffer = instance.createEncryptedInput(
          thisAddr,
          thisSigner.address
        );
        buffer.add32(BigInt(inputAssets));
        buffer.add32(BigInt(inputRiskPref));
        buffer.add32(BigInt(inputPositionVol));
        const enc = await buffer.encrypt();
        if (isStale()) {
          setMessage("Ignore analyze (stale)");
          return;
        }
        setMessage("Send transaction analyze(...)");
        const contractRW = new ethers.Contract(
          thisAddr,
          contractRef.current!.abi,
          thisSigner
        );
        const tx: ethers.TransactionResponse = await contractRW.analyze(
          enc.handles[0],
          enc.handles[1],
          enc.handles[2],
          enc.inputProof
        );
        setMessage(`Waiting for transaction confirmation...`);
        const receipt = await tx.wait();
        setMessage(
          receipt?.status === 1 ? 'Analysis completed successfully. Refreshing data...' : 'Transaction completed. Refreshing data...'
        );
        if (isStale()) {
          setMessage("Ignore refresh (stale)");
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
        refresh();
      } catch (e) {
        setMessage(`Analyze failed: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        isBusyRef.current = false;
        setIsBusy(false);
      }
    };
    run();
  }, [
    contract.address,
    instance,
    ethersSigner,
    chainId,
    inputAssets,
    inputRiskPref,
    inputPositionVol,
    sameChain,
    sameSigner,
    refresh,
  ]);

  return {
    contractAddress: contract.address,
    isDeployed,
    isBusy,
    message,
    handles,
    clear,
    canGet,
    canDecrypt,
    canAnalyze,
    refresh,
    decryptAll,
    analyze,
    inputAssets,
    inputRiskPref,
    inputPositionVol,
    setInputAssets,
    setInputRiskPref,
    setInputPositionVol,
  };
};


