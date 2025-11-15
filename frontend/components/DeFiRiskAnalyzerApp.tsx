"use client";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useDeFiRiskAnalyzer } from "@/hooks/useDeFiRiskAnalyzer";
import { errorNotDeployed } from "./ErrorNotDeployed";

// Convert risk level number to human-readable text
const getRiskLevelText = (level: bigint | undefined): string => {
  if (level === undefined) return "-";
  const num = Number(level);
  if (num === 0) return "Low Risk";
  if (num === 1) return "Medium Risk";
  if (num === 2) return "High Risk";
  return String(level);
};

const getFhevmStatusText = (status: string): string => {
  switch (status) {
    case "idle":
      return "Initializing...";
    case "loading":
      return "Loading FHEVM...";
    case "ready":
      return "Ready";
    case "error":
      return "Error occurred";
    default:
      return status;
  }
};

export const DeFiRiskAnalyzerApp = () => {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const dapp = useDeFiRiskAnalyzer({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-md w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">DeFi Risk Analyzer</h1>
            <p className="text-gray-600 text-lg">Powered by Fully Homomorphic Encryption</p>
          </div>
          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={connect}
          >
            Connect MetaMask Wallet
          </button>
          <p className="mt-4 text-sm text-gray-500">
            Please connect your MetaMask wallet to continue
          </p>
        </div>
      </div>
    );
  }

  if (dapp.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">DeFi Risk Analyzer</h1>
          <p className="text-blue-100 mt-1">Confidential portfolio risk assessment using FHEVM</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Wallet Connection
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Network Chain ID:</span>
                <span className="font-mono text-sm font-semibold text-gray-900 bg-white px-3 py-1 rounded border border-gray-200">
                  {String(chainId)}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-gray-600 text-sm">Account:</span>
                <span className="font-mono text-xs font-medium text-gray-900 bg-white px-3 py-1 rounded border border-gray-200 break-all max-w-xs text-right">
                  {accounts && accounts.length > 0 ? accounts[0] : "No account"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              FHEVM Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  fhevmStatus === 'ready' ? 'bg-green-100 text-green-800' :
                  fhevmStatus === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {getFhevmStatusText(fhevmStatus)}
                </span>
              </div>
              {fhevmError && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    {fhevmError.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Portfolio Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Assets
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                type="number"
                placeholder="e.g., 100000"
                value={dapp.inputAssets}
                onChange={(e) => dapp.setInputAssets(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Enter your total asset value</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Risk Preference
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                type="number"
                placeholder="1-5"
                min="1"
                max="5"
                value={dapp.inputRiskPref}
                onChange={(e) => dapp.setInputRiskPref(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Scale: 1 (conservative) to 5 (aggressive)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position Volatility
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                type="number"
                placeholder="0-100"
                min="0"
                max="100"
                value={dapp.inputPositionVol}
                onChange={(e) => dapp.setInputPositionVol(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500">Volatility percentage (0-100)</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            className={`py-4 px-6 rounded-lg font-semibold transition-all duration-200 shadow-md ${
              dapp.canAnalyze
                ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!dapp.canAnalyze}
            onClick={dapp.analyze}
          >
            {dapp.canAnalyze ? '🔍 Analyze Portfolio' : dapp.isBusy ? '⏳ Processing...' : '⚠️ Complete inputs first'}
          </button>
          <button
            className={`py-4 px-6 rounded-lg font-semibold transition-all duration-200 shadow-md ${
              dapp.canGet
                ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!dapp.canGet}
            onClick={dapp.refresh}
          >
            {dapp.canGet ? '🔄 Refresh Data' : '⚠️ Unavailable'}
          </button>
          <button
            className={`py-4 px-6 rounded-lg font-semibold transition-all duration-200 shadow-md ${
              dapp.canDecrypt
                ? 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!dapp.canDecrypt}
            onClick={dapp.decryptAll}
          >
            {dapp.canDecrypt ? '🔓 Decrypt Results' : dapp.isBusy ? '⏳ Processing...' : '⚠️ No data to decrypt'}
          </button>
        </div>

        {/* Results Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Encrypted Handles */}
          <div className="bg-gray-50 rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Encrypted Data Handles
            </h2>
            <div className="space-y-3">
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Risk Score Handle</p>
                <p className="font-mono text-xs text-gray-700 break-all">{dapp.handles.riskScore || "Not generated"}</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Risk Level Handle</p>
                <p className="font-mono text-xs text-gray-700 break-all">{dapp.handles.riskLevel || "Not generated"}</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Asset Distribution Handles</p>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <p className="text-xs text-gray-500">Stable</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{dapp.handles.stable || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Blue Chip</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{dapp.handles.bluechip || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">High Risk</p>
                    <p className="font-mono text-xs text-gray-700 break-all">{dapp.handles.highRisk || "-"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Decrypted Results */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analysis Results
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-2">Risk Score</p>
                <p className="text-3xl font-bold text-blue-900">
                  {dapp.clear.riskScore !== undefined ? String(dapp.clear.riskScore) : "—"}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${
                dapp.clear.riskLevel === 0n ? 'bg-green-50 border-green-200' :
                dapp.clear.riskLevel === 1n ? 'bg-yellow-50 border-yellow-200' :
                dapp.clear.riskLevel === 2n ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <p className={`text-sm font-medium mb-2 ${
                  dapp.clear.riskLevel === 0n ? 'text-green-700' :
                  dapp.clear.riskLevel === 1n ? 'text-yellow-700' :
                  dapp.clear.riskLevel === 2n ? 'text-red-700' :
                  'text-gray-700'
                }`}>Risk Level</p>
                <p className={`text-2xl font-bold ${
                  dapp.clear.riskLevel === 0n ? 'text-green-900' :
                  dapp.clear.riskLevel === 1n ? 'text-yellow-900' :
                  dapp.clear.riskLevel === 2n ? 'text-red-900' :
                  'text-gray-900'
                }`}>
                  {getRiskLevelText(dapp.clear.riskLevel)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 font-medium mb-3">Recommended Portfolio Distribution</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Stable Assets</p>
                    <p className="text-xl font-bold text-gray-900">
                      {dapp.clear.stable !== undefined ? `${String(dapp.clear.stable)}%` : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Blue Chip</p>
                    <p className="text-xl font-bold text-gray-900">
                      {dapp.clear.bluechip !== undefined ? `${String(dapp.clear.bluechip)}%` : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">High Risk</p>
                    <p className="text-xl font-bold text-gray-900">
                      {dapp.clear.highRisk !== undefined ? `${String(dapp.clear.highRisk)}%` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {dapp.message && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">{dapp.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


