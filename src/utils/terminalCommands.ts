import { sendToOllama } from './ollamaUtils';

// Base64 encoded API data for security
const ENCODED_API_DATA = 'aHR0cHM6Ly9hcGkucnVnY2hlY2sueHl6L3YxL3Rva2Vucy8='; // https://api.rugcheck.xyz/v1/tokens/
const ENCODED_API_KEY = 'ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmxlU0FpT2pFM05EZ3hOVGN4TnpRc0ltbGtJam9pTm1VeVIzUk9PV05hVUdSeWRYQnhVamR0Y21aek5URlRSMkZ6TlRGVFIyRnRiVWczWjFGV09UVnJWblVKVUdwMVZGWWlmUS5weHZ5V1U0cTZyakhUOHNmRUNDczhrMHFCNHAzYVVJMjZTTnNNdDMwd3g0'; // API key

export interface CommandResult {
  type: 'string' | 'function' | 'async';
  value: string | (() => void) | ((args: string) => string) | ((args: string) => Promise<string>);
}

// Function to validate SOL token address
const isValidSolTokenAddress = (address: string): boolean => {
  // SOL token addresses are typically 32-44 characters long and contain alphanumeric characters
  const solAddressPattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solAddressPattern.test(address);
};

// Function to decode base64
const decodeBase64 = (encoded: string): string => {
  return atob(encoded);
};

// Function to extract key security data from the full JSON response
const extractSecurityData = (data: any) => {
  return {
    token: {
      symbol: data.token?.symbol || data.fileMeta?.symbol || 'Unknown',
      name: data.fileMeta?.name || 'Unknown'
    },
    score: data.score,
    score_normalised: data.score_normalised,
    rugged: data.rugged,
    risks: data.risks || [],
    mintAuthority: data.mintAuthority,
    freezeAuthority: data.freezeAuthority,
    transferFee: data.transferFee,
    topHolders: data.topHolders?.slice(0, 5) || [], // Only top 5 holders
    insiderNetworks: data.insiderNetworks || [],
    graphInsidersDetected: data.graphInsidersDetected,
    markets: data.markets?.map(market => ({
      lpLocked: market.lp?.lpLocked,
      lpLockedPct: market.lp?.lpLockedPct,
      lpLockedUSD: market.lp?.lpLockedUSD
    })) || [],
    verification: data.verification
  };
};

// Function to fetch token report from RugCheck API
const fetchTokenReport = async (tokenAddress: string): Promise<string> => {
  try {
    const baseUrl = decodeBase64(ENCODED_API_DATA);
    const apiKey = decodeBase64(ENCODED_API_KEY);
    const url = `${baseUrl}${tokenAddress}/report`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`TITAN ERROR: API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    // Extract only important security data
    const securityData = extractSecurityData(data);
    
    // Send only key data to AI for analysis
    const aiPrompt = `Analyze this token security data and provide a very short summary (max 2-3 sentences) focusing on main risks:

${JSON.stringify(securityData, null, 2)}

Focus only on the most critical security risks and overall safety assessment.`;

    const aiAnalysis = await sendToOllama(aiPrompt);
    
    return `[SCAN] ${securityData.token.symbol} Security Analysis

${aiAnalysis}`;
    
  } catch (error) {
    console.error('TITAN scan error:', error);
    return `[ERROR] TITAN: Token scan failed - ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

export const createCommands = (
  setHistory: (history: string[] | ((prev: string[]) => string[])) => void,
  setActiveTab: (tab: string) => void,
  setUserBio: (bio: string) => void,
  setUserTwitter: (twitter: string) => void,
  userNickname: string = ''
) => {
  const commands: Record<string, CommandResult> = {
    help: {
      type: 'string',
      value: 'Available commands: help, clear, status, neural, scan, deploy, profile, dashboard, setbio, settwitter, ask'
    },
    clear: {
      type: 'function',
      value: () => {
        console.log('Clear command executed - resetting history');
        const welcomeMessage = userNickname 
          ? `Welcome ${userNickname.toUpperCase()} to Titan Terminal v1.0.0`
          : 'Welcome to Titan Terminal v1.0.0';
        
        setHistory([
          welcomeMessage,
          'Neural network interface initialized...',
          'Type "help" for available commands',
        ]);
      }
    },
    status: {
      type: 'string',
      value: 'System: Online | Neural Core: Active | Memory: 2.4GB/4GB'
    },
    neural: {
      type: 'string',
      value: 'Neural network processing... [████████████] 100%'
    },
    scan: {
      type: 'async',
      value: async (args: string) => {
        const tokenAddress = args.trim();
        
        if (!tokenAddress) {
          return 'Usage: scan <token_address>';
        }
        
        if (!isValidSolTokenAddress(tokenAddress)) {
          return '🔐 TITAN SECURITY: Upgrade to DARK mode to use more features';
        }
        
        return await fetchTokenReport(tokenAddress);
      }
    },
    deploy: {
      type: 'string',
      value: 'Deploying to production... ✓ Success'
    },
    profile: {
      type: 'function',
      value: () => setActiveTab('profile')
    },
    dashboard: {
      type: 'function',
      value: () => setActiveTab('dashboard')
    },
    setbio: {
      type: 'function',
      value: (args: string) => {
        const newBio = args || 'No bio provided';
        setUserBio(newBio);
        return `Bio updated: ${newBio}`;
      }
    },
    settwitter: {
      type: 'function',
      value: (args: string) => {
        const newTwitter = args.startsWith('@') ? args : `@${args}`;
        setUserTwitter(newTwitter);
        return `Twitter updated: ${newTwitter}`;
      }
    },
    ask: {
      type: 'async',
      value: async (args: string) => {
        if (!args.trim()) {
          return 'Usage: ask <your question>';
        }
        return await sendToOllama(args);
      }
    }
  };

  return commands;
};

export const executeCommand = async (
  command: string,
  args: string[],
  commands: Record<string, CommandResult>
): Promise<string | null> => {
  console.log('Executing command:', command, 'with args:', args);
  const cmd = commands[command];
  if (!cmd) {
    return `TITAN ERROR: Command not found: ${command}`;
  }

  if (cmd.type === 'string') {
    return cmd.value as string;
  } else if (cmd.type === 'async') {
    const func = cmd.value as (args: string) => Promise<string>;
    return await func(args.join(' '));
  } else {
    const func = cmd.value as (() => void) | ((args: string) => string);
    if (command === 'setbio' || command === 'settwitter') {
      return (func as (args: string) => string)(args.join(' '));
    } else {
      (func as () => void)();
      return null;
    }
  }
};
