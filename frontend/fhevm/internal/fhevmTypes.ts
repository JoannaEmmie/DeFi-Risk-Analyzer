export type FhevmRelayerSDKType = {
  __initialized__?: boolean;
  initSDK: (options?: unknown) => Promise<boolean>;
  createInstance: (config: any) => Promise<any>;
  SepoliaConfig: {
    aclContractAddress: `0x${string}`;
  } & Record<string, unknown>;
};

export type FhevmWindowType = {
  relayerSDK: FhevmRelayerSDKType;
};

export type FhevmInitSDKOptions = unknown;

export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;

export type FhevmLoadSDKType = () => Promise<void>;


