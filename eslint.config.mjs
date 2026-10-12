import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const eslintConfig = [
    { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
    ...coreWebVitals,
    ...typescript,
    {
        rules: {
            // Data fetching on mount/param change is the app's core pattern
            // (client pages fetching Bocconi data); this React Compiler rule
            // flags all of it.
            "react-hooks/set-state-in-effect": "off",
        },
    },
];

export default eslintConfig;
