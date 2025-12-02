import React from "react";

import { Button } from "@moodle/core_calendar/Button.js";

interface HomePageProps {
  title: string;
  [key: string]: any;
}

export const HomePage: React.FC<HomePageProps> = (ButtonProps) => {
  return (
    <div>
      <h1>{ButtonProps.title}</h1>
      <Button label={ButtonProps.label} />
    </div>
  );
};
