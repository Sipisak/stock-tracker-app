import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {WsStatusIndicator} from "@/components/WsStatusIndicator";

const Header = async ({ user }: { user: User }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/">
                    <Image src="/assets/icons/logo.svg" alt="Signalist logo" width={140} height={32} className="h-8 w-auto cursor-pointer" />
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>
                <div className="flex items-center gap-2 rounded-md bg-secondary/20 px-2 py-1">
                    <UserDropdown user={user} initialStocks={initialStocks} />
                    <WsStatusIndicator/>
                </div>
            </div>
        </header>
    )
}
export default Header
