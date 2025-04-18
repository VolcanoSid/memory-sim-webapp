import React, { useState } from "react";

interface TabProps {
  tabs: string[];
  children: React.ReactNode[];
}

const Tabs: React.FC<TabProps> = ({ tabs, children }) => {
  const [active, setActive] = useState(0);
  return (
    <div className="w-full">
      <div className="flex border-b mb-4">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`py-2 px-4 font-semibold border-b-2 transition ${
              index === active
                ? "border-blue-500 text-blue-600 dark:text-blue-300"
                : "border-transparent text-gray-500"
            }`}
            onClick={() => setActive(index)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>{children[active]}</div>
    </div>
  );
};

export default Tabs;
