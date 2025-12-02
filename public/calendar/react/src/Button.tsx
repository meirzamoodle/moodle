import React, { useState } from "react";
import uuid from "react-uuid";

export interface ButtonProps {
  label: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ label }) => {
  const [myId, setMyId] = useState(uuid());

  const clickHandler = () => {
    alert(`Button clicked! ID: ${myId}`);
  };

  return (
    <button
      onClick={clickHandler}
      style={{ padding: "8px 12px", borderRadius: 4 }}
    >
      {label}
    </button>
  );
};
