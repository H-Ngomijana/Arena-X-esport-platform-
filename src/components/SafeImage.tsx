import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_PLACEHOLDER = "/placeholder.svg";

type SafeImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

const SafeImage = ({ src, fallbackSrc = DEFAULT_PLACEHOLDER, onError, ...props }: SafeImageProps) => {
  const resolvedSrc = useMemo(() => src || fallbackSrc, [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(resolvedSrc as string | undefined);

  useEffect(() => {
    setCurrentSrc(resolvedSrc as string | undefined);
  }, [resolvedSrc]);

  return (
    <img
      {...props}
      src={currentSrc || fallbackSrc}
      onError={(event) => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
        onError?.(event);
      }}
    />
  );
};

export default SafeImage;
