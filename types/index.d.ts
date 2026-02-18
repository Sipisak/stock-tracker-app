
/*
  This file contains shared type definitions for the application.
  It is included in the tsconfig.json file, so no explicit imports are needed for these types.
*/

// ====== FORM TYPES ======

type SignUpFormData = {
    fullName: string;
    email: string;
    password?: string;
    country: string;
    investmentGoals: string;
    riskTolerance: string;
    preferredIndustry: string;
};

type SignInFormData = {
    email: string;
    password?: string;
};

type AlertFormData = {
    alertType: 'price' | 'percent' | 'volume';
    condition: 'upper' | 'lower';
    threshold: number;
};

// ====== COMPONENT PROPS ======

interface InputFieldProps {
    name: keyof SignUpFormData | keyof SignInFormData | keyof AlertFormData;
    label: string;
    placeholder?: string;
    type?: string;
    step?: string;
    register: any;
    error?: any;
    validation?: any;
}

interface SelectFieldProps {
    name: keyof SignUpFormData | keyof AlertFormData;
    label: string;
    placeholder?: string;
    options: { value: string; label: string }[];
    control: any;
    error?: any;
    required?: boolean;
}

interface CountrySelectFieldProps {
    name: keyof SignUpFormData;
    label: string;
    control: any;
    error?: any;
    required?: boolean;
}

interface FooterLinkProps {
    text: string;
    linkText: string;
    href: string;
}

interface SearchCommandProps {
    renderAs?: 'button' | 'text';
    label?: string;
    initialStocks: StockWithWatchlistStatus[];
}

interface WatchlistButtonProps {
    symbol: string;
    company: string;
    isInWatchlist: boolean;
    showTrashIcon?: boolean;
    type?: 'button' | 'icon';
    onWatchlistChange?: (symbol: string, isAdded: boolean) => void;
}

interface WatchlistTableProps {
    watchlist: {
        company: string;
        symbol: string;
        currentPrice: number;
        priceFormatted: string;
        changeFormatted: string;
        changePercent: number;
        marketCap: string;
        peRatio: string;
    }[];
}

// ====== API & DATA TYPES ======

interface StockWithWatchlistStatus {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
    isInWatchlist: boolean;
}

interface FinnhubSearchResponse {
    count: number;
    result: FinnhubSearchResult[];
}

interface FinnhubSearchResult {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
}

interface StockDetailsPageProps {
    params: {
        symbol: string;
    };
}

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, any>;
    height?: number;
    className?: string;
}