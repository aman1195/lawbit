import { useState, useEffect, ReactNode } from "react";
import cn from "classnames";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { Link } from "react-router-dom";
import Image from "@/components/Image";
import Button from "@/components/Button";
import styles from "./Header.module.sass";

type HeaderProps = {
    children?: ReactNode;
};

const Header = ({ children }: HeaderProps) => {
    const [headerStyle, setHeaderStyle] = useState<boolean>(false);

    useEffect(() => {
        const isScrolled = window.scrollY > 0;
        setHeaderStyle(isScrolled);
    }, []);

    useScrollPosition(({ currPos }) => {
        setHeaderStyle(currPos.y <= -1);
    });

    return (
        <header
            className={cn(styles.header, {
                [styles.fixed]: headerStyle,
            })}
        >
            {children}
        </header>
    );
};

export default Header;
