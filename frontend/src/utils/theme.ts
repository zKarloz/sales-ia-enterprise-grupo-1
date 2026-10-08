export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "salesia-theme";


export function getInitialTheme(): Theme {
    const storedTheme =
        localStorage.getItem(THEME_STORAGE_KEY);

    if (
        storedTheme === "light" ||
        storedTheme === "dark"
    ) {
        return storedTheme;
    }

    return window.matchMedia(
        "(prefers-color-scheme: dark)",
    ).matches
        ? "dark"
        : "light";
}


export function applyTheme(
    theme: Theme,
) {
    const isDark = theme === "dark";

    document.documentElement.classList.toggle(
        "dark",
        isDark,
    );

    document.documentElement.style.colorScheme =
        theme;
}


export function saveTheme(
    theme: Theme,
) {
    localStorage.setItem(
        THEME_STORAGE_KEY,
        theme,
    );

    applyTheme(theme);
}