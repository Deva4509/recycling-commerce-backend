import {
  ArrowRight,
  Leaf,
  Recycle,
  ShieldCheck,
  Sparkles,
  TreePine,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import styled from "styled-components";
import { Link } from "react-router-dom";
import styles from "./ShopExperience.module.css";

const DynamicVisual = styled.div`
  position: relative;
  width: min(430px, 42vw);
  height: 430px;
  display: grid;
  place-items: center;

  @media (max-width: 900px) {
    width: 340px;
    height: 340px;
  }

  @media (max-width: 640px) {
    width: 290px;
    height: 290px;
    margin: 10px auto 0;
  }
`;

const VisualGlow = styled.div`
  position: absolute;
  width: 82%;
  height: 82%;
  border-radius: 50%;
  background:
    radial-gradient(
      circle,
      rgba(83, 235, 151, 0.28) 0%,
      rgba(39, 185, 110, 0.14) 32%,
      transparent 70%
    );
  filter: blur(5px);
`;

const Orbit = styled.div<{ $reverse?: boolean }>`
  position: absolute;
  width: 92%;
  height: 62%;
  border: 1px solid rgba(116, 234, 165, 0.18);
  border-radius: 50%;
  transform: rotate(${({ $reverse }) => ($reverse ? "-24deg" : "24deg")});
`;

const ProductStack = styled.div`
  position: relative;
  width: 230px;
  height: 300px;
  transform: rotate(-4deg);

  @media (max-width: 640px) {
    width: 175px;
    height: 230px;
  }
`;

const ProductSheet = styled.div<{
  $layer: number;
  $front?: boolean;
}>`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px;
  border: 1px solid
    ${({ $front }) =>
      $front
        ? "rgba(104, 219, 143, 0.6)"
        : "rgba(104, 219, 143, 0.18)"};
  border-radius: 24px;
  background: ${({ $front }) =>
    $front
      ? "linear-gradient(145deg, #f0f7e9, #d9ecd7)"
      : "linear-gradient(145deg, rgba(209,235,210,.72), rgba(145,195,159,.42))"};
  color: ${({ $front }) => ($front ? "#0b3925" : "#dff7e5")};
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.24);
  transform: translate(
      ${({ $layer }) => $layer * 14}px,
      ${({ $layer }) => $layer * -8}px
    )
    rotate(${({ $layer }) => $layer * 3 - 3}deg);
  z-index: ${({ $layer }) => $layer + 1};

  @media (max-width: 640px) {
    padding: 20px;
    border-radius: 18px;
  }
`;

const VisualBadge = styled.div`
  position: absolute;
  right: -18px;
  bottom: 28px;
  z-index: 10;
  padding: 12px 15px;
  border: 1px solid rgba(102, 231, 151, 0.2);
  border-radius: 14px;
  background: rgba(3, 37, 23, 0.9);
  backdrop-filter: blur(16px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);

  strong {
    display: block;
    color: #e7fff0;
    font-size: 11px;
  }

  span {
    display: block;
    margin-top: 3px;
    color: #86b39a;
    font-size: 8px;
  }

  @media (max-width: 640px) {
    right: -5px;
    bottom: 12px;
  }
`;

function InfoItem({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className={styles.infoItem}>
      <div className={styles.infoIcon}>{icon}</div>

      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function ShopExperience() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroBackground} />
        <div className={styles.heroGrid} />

        <div className={styles.heroContainer}>
          <motion.div
            className={styles.heroCopy}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className={styles.heroLabel}>
              <Sparkles size={13} />
              <span>THE GREENCORE COLLECTION</span>
            </div>

            <h1>
              Shop products
              <br />
              with a <em>second life.</em>
            </h1>

            <p className={styles.heroDescription}>
              Thoughtfully selected everyday products made from materials that
              deserve another chance — designed for a more circular lifestyle.
            </p>

            <div className={styles.heroPills}>
              <span>
                <Recycle size={14} />
                Recovered materials
              </span>

              <span>
                <Leaf size={14} />
                Conscious design
              </span>

              <span>
                <TreePine size={14} />
                Circular choices
              </span>
            </div>

            <div className={styles.heroActions}>
              <a href="#shop-catalog" className={styles.primaryButton}>
                Explore collection
                <ArrowRight size={16} />
              </a>

              <Link
                to="/vision-mission"
                className={styles.secondaryButton}
              >
                Why GreenCore?
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div>
                <strong>Everyday</strong>
                <span>Useful products</span>
              </div>

              <div>
                <strong>Recycled</strong>
                <span>Material stories</span>
              </div>

              <div>
                <strong>Circular</strong>
                <span>Better choices</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            className={styles.heroVisualWrapper}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <DynamicVisual>
              <VisualGlow />
              <Orbit />
              <Orbit $reverse />

              <ProductStack>
                <ProductSheet $layer={-1}>
                  <span className={styles.sheetLabel}>RECYCLED</span>
                  <strong className={styles.sheetTitle}>COTTON</strong>
                </ProductSheet>

                <ProductSheet $layer={0}>
                  <span className={styles.sheetLabel}>RECLAIMED</span>
                  <strong className={styles.sheetTitle}>WOOD</strong>
                </ProductSheet>

                <ProductSheet $layer={1} $front>
                  <div className={styles.sheetIcon}>
                    <Leaf size={35} />
                  </div>

                  <div>
                    <span className={styles.sheetBrand}>GREENCORE</span>
                    <strong className={styles.sheetMainTitle}>
                      EVERYDAY
                      <br />
                      ESSENTIALS
                    </strong>
                  </div>
                </ProductSheet>
              </ProductStack>

              <VisualBadge>
                <strong>Made for conscious living</strong>
                <span>Choose products with another life.</span>
              </VisualBadge>
            </DynamicVisual>
          </motion.div>
        </div>
      </section>

      <section className={styles.infoSection}>
        <div className={styles.infoContainer}>
          <InfoItem
            icon={<Recycle size={19} />}
            title="Recovered materials"
            text="Materials stay in circulation instead of becoming waste."
          />

          <InfoItem
            icon={<Leaf size={19} />}
            title="Conscious design"
            text="Useful products designed around everyday needs."
          />

          <InfoItem
            icon={<ShieldCheck size={19} />}
            title="Thoughtful selection"
            text="Products are presented around their material story."
          />

          <InfoItem
            icon={<Users size={19} />}
            title="Better choices"
            text="Small purchasing decisions can support circular living."
          />
        </div>
      </section>
    </>
  );
}
