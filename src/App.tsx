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
import { UserProfile, VerifyResponse } from "./types/line";
import axios from 'axios';
import liff from '@line/liff';

const VERIFY_API_URL = import.meta.env.VITE_VERIFY_API_URL as string;
const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;

const App: React.FC = () => {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const [bal, setBal] = useState<string>("0");
  const { walletProvider } = useAppKitProvider("eip155");
  const { chainId } = useAppKitNetwork();
  const [lineProfile, setLineProfile] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const verifyToken = useCallback(async (accessToken: string): Promise<UserProfile> => {
    try {
      const response = await axios.post<VerifyResponse>(
        VERIFY_API_URL,
        { access_token: accessToken }
      );

      if (!response.data.success || !response.data.user) {
        throw new Error(response.data.message || 'Verification failed');
      }

      console.log('Verification successful:', response.data);
      return response.data.user;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Verification error';
      throw new Error(errorMessage);
    }
  }, []);

  const fetchUserProfile = useCallback(async (): Promise<void> => {
    try {
        const accessToken = liff.getAccessToken();
        if (!accessToken) {
          throw new Error('Access token not found');
        }
  
        console.log('access token:', accessToken);

        const userProfile = await verifyToken(accessToken);
        setLineProfile(userProfile);
        setIsLoggedIn(true);
        localStorage.setItem('lineProfile', JSON.stringify(userProfile));
    } catch (error) {
      console.error('Line login error:', error);
      toast.error('Failed to login with Line');
    }
  }, [verifyToken]);

  const initializeLiff = useCallback(async (): Promise<void> => {
    try {
      await liff.init({ liffId: LIFF_ID });
      if (liff.isLoggedIn()) {
        setIsLoggedIn(true);
        await fetchUserProfile();
      }
    } catch (err) {
      console.log(`Error initializing LIFF: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    void initializeLiff();
  }, [initializeLiff]);

  const login = useCallback((): void => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }, []);

  const logout = useCallback((): void => {
    if (liff.isLoggedIn()) {
      liff.logout();
      setIsLoggedIn(false);
      setLineProfile(null);
    }
  }, []);
  const onSignMessage = async (): Promise<void> => {
    if (!isLoggedIn) {
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
    if (!isLoggedIn) {
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
        {!isLoggedIn ? (
          <button 
            onClick={login} 
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
              onClick={logout}
              className="logout-btn"
              type="button"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {isLoggedIn && (
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

      {isLoggedIn && isConnected && (
        <div className="flex mt">
          <p>Kaia Balance: {bal}</p>
          <button onClick={onSendKaia} type="button">
            Send Kaia
          </button>
        </div>
      )}

      {isLoggedIn && isConnected && (
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
