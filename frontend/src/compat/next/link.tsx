import React, { forwardRef } from "react";
import { Link as RouterLink } from "react-router-dom";

type NextLinkProps = Omit<React.ComponentPropsWithoutRef<typeof RouterLink>, "to"> & {
  href: string;
  replace?: boolean;
};

function isExternalHref(href: string): boolean {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  );
}

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(function Link(
  { href, replace, children, ...rest },
  ref
) {
  if (isExternalHref(href)) {
    return (
      <a
        ref={ref}
        href={href}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <RouterLink
      ref={ref as React.Ref<HTMLAnchorElement>}
      to={href}
      replace={replace}
      {...rest}
    >
      {children}
    </RouterLink>
  );
});

export default Link;
