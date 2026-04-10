import React from "react";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};

export default function Image({ priority, fill, style, ...rest }: ImageProps) {
  const loading = priority ? "eager" : rest.loading ?? "lazy";
  const imgStyle: React.CSSProperties | undefined = fill
    ? {
        ...(style ?? {}),
        objectFit: "cover",
        width: "100%",
        height: "100%",
      }
    : style;

  return <img {...rest} loading={loading} style={imgStyle} />;
}
