"use client";

export function errorNotDeployed(chainId?: number) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 shadow-lg">
          <div className="flex items-start">
            <svg className="w-8 h-8 text-red-600 mt-1 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-3">Contract Not Deployed</h2>
              <p className="text-red-800 mb-4">
                The smart contract has not been deployed to the network with Chain ID <span className="font-mono font-semibold">{String(chainId)}</span>.
              </p>
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <p className="text-sm text-gray-700 font-semibold mb-2">To fix this issue:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Deploy the smart contract to your target network first</li>
                  <li>Run <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">npm run genabi</code> in the frontend directory</li>
                  <li>Refresh this page to reconnect</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


