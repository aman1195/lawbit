import { ReactNode, forwardRef } from "react";
import cn from "classnames";
import styles from "./Button.module.sass";

type ButtonProps = {
    className?: string;
    title: ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: 'default' | 'orange';
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'title'>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, title, href, onClick, variant = 'default', ...props }, ref) => {
    const CreatedTag = href ? "a" : "button";

    return (
        <CreatedTag
            ref={ref}
            className={cn(className, styles.button, variant === 'orange' && styles.orange)}
            href={href}
            onClick={onClick}
            // target={href ? "_blank" : undefined}
            rel={href ? "noopener noreferrer" : undefined}
            {...props}
        >
            <span className={styles.title}>{title}</span>
            <span className={styles.circle}></span>
        </CreatedTag>
    );
});

Button.displayName = "Button";

export default Button;
