export type Eip6963AnnounceProviderEvent = {
  detail: Eip6963ProviderDetail;
} & Event;

export type Eip6963ProviderDetail = {
  info: {
    // required by EIP-6963:
    uuid: string;
    name: string;
    icon: `data:image/svg+xml;base64,${string}`;
    rdns: string;
  };
  provider: unknown;
};


