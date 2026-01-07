// NavItem.js
import React from "react";
import Link from "next/link";

const NavItem = ({ label, href, icon, isOpen, isActive, onClick }) => {
  const commonClasses = `relative flex items-center p-2 rounded group overflow-hidden transition-colors duration-200 ${
    isActive ? "bg-blue-500 text-white" : "hover:bg-blue-500/20" // Fondo muy sutil al hover
  }`;
  const iconClasses = `min-w-[24px] mr-2 flex-shrink-0 ${
    isOpen ? "justify-start" : "justify-center"
  } transition-opacity duration-200 ${
    isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
  }`;
  const labelContainerClasses = `overflow-hidden`;
  const labelClasses = `whitespace-nowrap transition-opacity duration-300 ${
    isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-[-10px]"
  } ${isActive ? "text-white" : ""}`;
  const hoverEffectClasses = `absolute bottom-0 left-0 h-0.5 w-full bg-white transform scale-x-0 transition-transform duration-200 group-hover:scale-x-100`;
  const tooltipClasses = `absolute left-full ml-3 min-w-max bg-gray-800 text-gray-100 text-xs rounded shadow-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10`;

  return (
    <Link href={href} legacyBehavior>
      <a onClick={onClick} className={commonClasses}>
        <span className={iconClasses}>{icon}</span>
        <span className={labelContainerClasses}>
          <span className={labelClasses}>{label}</span>
        </span>
        {!isOpen && <span className={tooltipClasses}>{label}</span>}
        <span className={hoverEffectClasses} />
      </a>
    </Link>
  );
};

export default NavItem;
