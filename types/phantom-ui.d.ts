declare module "@aejkatappaja/phantom-ui/ssr.css";
declare module "*.css";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "phantom-ui": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          loading?: string;
          "data-shimmer-ignore"?: string;
          "data-shimmer-no-children"?: string;
          "data-shimmer-width"?: string;
          "data-shimmer-height"?: string;
        },
        HTMLElement
      >
    }
  }
}
