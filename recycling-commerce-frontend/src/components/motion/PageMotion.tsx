import { ReactNode, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

interface PageMotionProps {
  children: ReactNode;
}

export default function PageMotion({ children }: PageMotionProps) {
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    window.scrollTo({ top: 0, behavior: "instant" });

    const elements = Array.from(
      root.querySelectorAll<HTMLElement>(
        [
          "section",
          "article",
          "main > div > div",
          "[class*='card']",
          "[class*='hero']",
          "[class*='section']",
          "h1",
          "h2",
          "h3",
          ".product-card",
          ".category-card",
          ".contact-info-card",
        ].join(",")
      )
    ).filter((element, index, all) => all.indexOf(element) === index);

    elements.forEach((element, index) => {
      element.classList.add("greencore-scroll-reveal");
      element.style.setProperty(
        "--motion-delay",
        `${Math.min(index * 45, 280)}ms`
      );
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("greencore-scroll-visible");
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -7% 0px",
      }
    );

    elements.forEach((element) => observer.observe(element));

    requestAnimationFrame(() => {
      root.classList.add("greencore-page-enter");
    });

    return () => {
      observer.disconnect();
    };
  }, [location.pathname]);

  return (
    <div
      ref={rootRef}
      key={location.pathname}
      className="greencore-page-motion"
    >
      {children}
    </div>
  );
}
