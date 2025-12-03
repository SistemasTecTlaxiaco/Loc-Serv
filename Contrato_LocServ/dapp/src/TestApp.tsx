import React from "react";

export default function TestApp() {
    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
            <h1>Test - LocServ DApp</h1>
            <p>Si ves esto, React está funcionando correctamente.</p>
            <p>Contract ID: {import.meta.env.VITE_CONTRACT_ID}</p>
            <p>RPC URL: {import.meta.env.VITE_RPC_URL}</p>
        </div>
    );
}
