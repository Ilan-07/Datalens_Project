import React, { lazy, Suspense } from "react";

type DynamicImportFn = () => Promise<any>;
type DynamicOptions = {
  ssr?: boolean;
  loading?: React.ComponentType<any>;
};

export default function dynamic(
  importFn: DynamicImportFn,
  options?: DynamicOptions
): React.ComponentType<any> {
  const LazyComponent = lazy(async () => {
    const module = await importFn();
    return module?.default ? module : { default: module };
  });

  const LoadingComponent = options?.loading ?? null;

  function DynamicComponent(props: any) {
    return (
      <Suspense fallback={LoadingComponent ? <LoadingComponent /> : null}>
        <LazyComponent {...props} />
      </Suspense>
    );
  }

  return DynamicComponent;
}
