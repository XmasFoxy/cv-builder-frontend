import { ErrorScreen } from "./error-screen";

export function UnsupportedDeviceScreen() {
  return (
    <ErrorScreen
      heading="Oops"
      description={
        <>
          This app isn’t supported on mobile devices.
          <span className="block">Please open it on a desktop or tablet to continue.</span>
        </>
      }
    />
  );
}
