import {
  useAppKit,
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitProvider,
} from "@reown/appkit/react";
import "./App.css";
import "./connection.ts";
import { BrowserProvider, Eip1193Provider, ethers } from "ethers";
import { toast, ToastContainer } from "react-toastify";
import { useEffect, useState, useCallback } from "react";
import "react-toastify/dist/ReactToastify.css";
import { useTokenFunctions } from "./hooks/contractHook/useTokenContract.ts";
import { formatAddress } from "./utils.ts";
import { useLINEAuth } from "./hooks/useLINEAuth.ts";

function App() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [bal, setBal] = useState<string | null>("0");
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId } = useAppKitNetwork();
  const { profile, isLoggedIn, login, logout } = useLINEAuth();

  const onSignMessage = async () => {
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);
    const signer = await provider.getSigner();
    const message = "Hello, this is Appkit Example";
    try {
      const signature = await signer?.signMessage(message);
      console.log({ signature, address, message });
    } catch (error) {
      console.log(error);
    }
  };

  const onSendKaia = async () => {
    console.log(chainId);
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }
    if (chainId !== 1001) {
      toast.error("Please connect to Kaia network");
      return;
    }
    const provider = new BrowserProvider(walletProvider as Eip1193Provider);
    const signer = await provider.getSigner();

    const to = "0x97bbeC5dadcA85AFBe331035f3F63d7a25fC7f75";

    const amount = "1000000000000000000";
    try {
      const tx = await signer?.sendTransaction({
        to,
        value: amount,
      });
      tx.wait();
      console.log(tx);
      toast.success(
        `${ethers.formatEther(amount)} KAIA sent to ${formatAddress(to)}`
      );
      getKaiaBalance();
    } catch (error) {
      console.log(error);
    }
  };

  const getKaiaBalance = useCallback(async () => {
    if (!address) return;
    if (chainId !== 1001) {
      return;
    }
    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);

      const balance = await provider.getBalance(address);

      const formattedBalance = ethers.formatEther(balance);
      setBal(formattedBalance);
      console.log(`Balance of ${address}: ${formattedBalance} Kaia`);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBal(null);
    }
  }, [address, walletProvider, chainId]);

  useEffect(() => {
    getKaiaBalance();
  }, [address, getKaiaBalance]);

  const {
    isLoading,
    tokenBalance,
    tokenDetail,
    mint,
    transfer,
    isMinting,
    isTransferring,
  } = useTokenFunctions();

  return (
    <>
      <div className="img">
        <img src="/kaia.png" className="logo" alt="" />
      </div>
      {!isLoggedIn && (
        <div className="flex">
          <button onClick={login}>
            {isLoggedIn ? formatAddress(profile?.userLineId ?? "") : <>Login with LINE</>}
          </button>
        </div>
      )}
      {isLoggedIn && (
        <>
          <div className="flex">
            <button onClick={() => open()}>
              {isConnected ? formatAddress(address ?? "") : <>Connect Wallet</>}
            </button>
            {isConnected && <button onClick={onSignMessage}>Sign Message</button>}
          </div>
          <div className="flex mt">
            {isConnected && <p>Kaia Balance: {bal}</p>}
            {isConnected && <button onClick={onSendKaia}>Send Kaia</button>}
            {isLoggedIn && (
              <button onClick={logout}>
                Logout
              </button>
            )}
          </div>
          <div className="flex mt">
            <div>
              {isConnected ? (
                isLoading ? (
                  <p>Loading...</p>
                ) : (
                  <div>
                    <p>
                      Token Balance:{" "}
                      {tokenBalance != null
                        ? Number(
                            ethers.formatUnits(tokenBalance.toString(), 18)
                          ).toLocaleString()
                        : 0}
                    </p>
                    <p>Token Name: {tokenDetail?.name}</p>
                    <p>Token symbol: {tokenDetail?.symbol}</p>
                    <p>Token Decimal: {tokenDetail?.decimals}</p>
                  </div>
                )
              ) : (
                <p>Please connect your wallet to see token details.</p>
              )}
            </div>
            <div className="flex-2">
              {isConnected && (
                <>
                  {" "}
                  <button onClick={() => mint()}>
                    {isMinting ? "Minting" : "Mint Token"}
                  </button>
                  <button onClick={() => transfer()}>
                    {isTransferring ? "Sending" : "Transfer"}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
      <ToastContainer />
    </>
  );
}

export default App;
