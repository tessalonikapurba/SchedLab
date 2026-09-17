"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");

    useEffect(() => {
        const savedTheme = localStorage.getItem("schedlab-theme") as Theme | null;

        if (savedTheme === "light" || savedTheme === "dark") {
            setThemeState(savedTheme);

            document.documentElement.classList.toggle(
                "dark",
                savedTheme === "dark"
            );
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);

        localStorage.setItem("schedlab-theme", newTheme);

        document.documentElement.classList.toggle(
            "dark",
            newTheme === "dark"
        );
    };

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    return (
        <ThemeContext.Provider
            value={{
                theme,
                toggleTheme,
                setTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error("useTheme must be used inside ThemeProvider");
    }

    return context;
}