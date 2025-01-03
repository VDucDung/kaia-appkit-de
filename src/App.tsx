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
import { useTokenFunctions } from "./hooks/contractHook/useTokenContract";
import { formatAddress } from "./utils";
import { LineProfile, LineTokenResponse } from "./types/line";

const App: React.FC = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [bal, setBal] = useState<string>("0");
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId } = useAppKitNetwork();
  const [lineProfile, setLineProfile] = useState<LineProfile | null>(null);
  const [isLineLoggedIn, setIsLineLoggedIn] = useState<boolean>(false);

  const LINE_CLIENT_ID: string = import.meta.env.VITE_LINE_CLIENT_ID;
  const LINE_REDIRECT_URI: string = import.meta.env.VITE_LINE_REDIRECT_URI;
  const LINE_SCOPE: string = 'profile openid email';

  const handleLineLogin = (): void => {
    const lineAuthUrl: string = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINE_REDIRECT_URI)}&state=line&scope=${encodeURIComponent(LINE_SCOPE)}`;
    window.location.href = lineAuthUrl;
  };

  const handleLineCallback = async (code: string): Promise<void> => {
    try {
      const response = await fetch('/api/line/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data: LineTokenResponse = await response.json();
      
      if (data.access_token) {
        const profileResponse = await fetch('https://api.line.me/v2/profile', {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        
        const profile: LineProfile = await profileResponse.json();
        setLineProfile(profile);
        setIsLineLoggedIn(true);
        localStorage.setItem('lineProfile', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Line login error:', error);
      toast.error('Failed to login with Line');
    }
  };

  const handleLogout = (): void => {
    setLineProfile(null);
    setIsLineLoggedIn(false);
    localStorage.removeItem('lineProfile');
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const savedProfile = localStorage.getItem('lineProfile');
    
    if (savedProfile) {
      setLineProfile(JSON.parse(savedProfile));
      setIsLineLoggedIn(true);
    } else if (code) {
      handleLineCallback(code);
    }
  }, []);

  const onSignMessage = async (): Promise<void> => {
    if (!isLineLoggedIn) {
      toast.error("Please login with Line first");
      return;
    }
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }

    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      const signer = await provider.getSigner();
      const message = "Hello, this is Appkit Example";
      const signature = await signer.signMessage(message);
      console.log({ signature, address, message });
      toast.success("Message signed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign message");
    }
  };

  const onSendKaia = async (): Promise<void> => {
    if (!isLineLoggedIn) {
      toast.error("Please login with Line first");
      return;
    }
    if (!address) {
      toast.error("Please connect wallet");
      return;
    }
    if (chainId !== 1001) {
      toast.error("Please connect to Kaia network");
      return;
    }

    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      const signer = await provider.getSigner();
      const to = "0x97bbeC5dadcA85AFBe331035f3F63d7a25fC7f75";
      const amount = "1000000000000000000";

      const tx = await signer.sendTransaction({
        to,
        value: amount,
      });
      
      await tx.wait();
      toast.success(`${ethers.formatEther(amount)} KAIA sent to ${formatAddress(to)}`);
      getKaiaBalance();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send KAIA");
    }
  };

  const getKaiaBalance = useCallback(async (): Promise<void> => {
    if (!address || chainId !== 1001) return;

    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      const balance = await provider.getBalance(address);
      const formattedBalance = ethers.formatEther(balance);
      setBal(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBal("0");
    }
  }, [address, walletProvider, chainId]);

  useEffect(() => {
    getKaiaBalance();
  }, [getKaiaBalance]);

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
        <img src="/kaia.png" className="logo" alt="Kaia Logo" />
      </div>
      
      <div className="flex">
        {!isLineLoggedIn ? (
          <button 
            onClick={handleLineLogin} 
            className="line-login-btn"
            type="button"
          >
            Login with Line
          </button>
        ) : (
          <div className="profile-info">
            {lineProfile?.pictureUrl && (
              <img 
                src={lineProfile.pictureUrl} 
                alt="Profile" 
                className="profile-pic" 
              />
            )}
            <span>{lineProfile?.displayName}</span>
            <button 
              onClick={handleLogout}
              className="logout-btn"
              type="button"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {isLineLoggedIn && (
        <div className="flex">
          <button onClick={() => open()} type="button">
            {isConnected ? formatAddress(address ?? "") : "Connect Wallet"}
          </button>
          {isConnected && (
            <button onClick={onSignMessage} type="button">
              Sign Message
            </button>
          )}
        </div>
      )}

      {isLineLoggedIn && isConnected && (
        <div className="flex mt">
          <p>Kaia Balance: {bal}</p>
          <button onClick={onSendKaia} type="button">
            Send Kaia
          </button>
        </div>
      )}

      {isLineLoggedIn && isConnected && (
        <div className="flex mt">
          <div>
            {isLoading ? (
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
                <p>Token Symbol: {tokenDetail?.symbol}</p>
                <p>Token Decimal: {tokenDetail?.decimals}</p>
              </div>
            )}
          </div>
          <div className="flex-2">
            <button 
              onClick={() => mint()} 
              type="button"
              disabled={isMinting}
            >
              {isMinting ? "Minting..." : "Mint Token"}
            </button>
            <button 
              onClick={() => transfer()} 
              type="button"
              disabled={isTransferring}
            >
              {isTransferring ? "Sending..." : "Transfer"}
            </button>
          </div>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default App;
