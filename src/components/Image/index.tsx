import { useState } from "react";
import cn from "classnames";
import styles from "./Image.module.sass";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    priority?: boolean;
}

const Image = ({ className, ...props }: ImageProps) => {
    const [loaded, setLoaded] = useState(false);

    return (
        <img
            className={cn(styles.image, { [styles.loaded]: loaded }, className)}
            onLoad={() => setLoaded(true)}
            {...props}
        />
    );
};

export default Image;
