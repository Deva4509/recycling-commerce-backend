import styled from "styled-components";

export const GalleryPage = styled.main`
  --gallery-bg: #03150f;
  --gallery-bg-deep: #02110c;
  --gallery-panel: #062218;
  --gallery-green: #35d979;
  --gallery-green-soft: #75eaa5;
  --gallery-text: #f2fff7;
  --gallery-muted: #8eaaa0;
  --gallery-border: rgba(89, 220, 143, 0.18);
  --gallery-border-strong: rgba(89, 220, 143, 0.3);

  min-height: 100vh;
  overflow: hidden;
  background: var(--gallery-bg);
  color: var(--gallery-text);
`;

export const Container = styled.div`
  width: min(1180px, calc(100% - 40px));
  margin: 0 auto;

  @media (max-width: 760px) {
    width: min(100% - 28px, 1180px);
  }
`;

export const Hero = styled.section`
  position: relative;
  min-height: 620px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  isolation: isolate;
  background: #03170f;
`;

export const HeroContent = styled(Container)`
  position: relative;
  min-height: 620px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  padding: 110px 0 75px;

  @media (max-width: 760px) {
    min-height: 680px;
    align-items: flex-start;
    padding: 105px 0 65px;
  }
`;

export const HeroCopy = styled.div`
  position: relative;
  z-index: 3;
  width: min(650px, 100%);

  p {
    max-width: 540px;
    margin: 30px 0 0;
    color: var(--gallery-muted);
    font-size: 1rem;
    line-height: 1.75;
  }
`;

export const HeroLabel = styled.span`
  display: inline-flex;
  padding: 5px 10px;
  border: 1px solid rgba(101, 228, 151, 0.22);
  border-radius: 999px;
  background: rgba(42, 170, 98, 0.09);
  color: var(--gallery-green-soft);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
`;

export const HeroTitle = styled.h1`
  margin: 18px 0 0;
  font-size: clamp(4rem, 7.3vw, 7rem);
  font-weight: 650;
  line-height: 0.88;
  letter-spacing: -0.065em;

  span {
    display: block;
    color: var(--gallery-green-soft);
  }

  @media (max-width: 760px) {
    font-size: 3.5rem;
  }
`;

export const HeroEmblem = styled.div`
  position: relative;
  flex: 0 0 350px;
  width: 350px;
  height: 350px;
  display: grid;
  place-items: center;

  @media (max-width: 1050px) {
    flex-basis: 280px;
    width: 280px;
    height: 280px;
  }

  @media (max-width: 760px) {
    position: absolute;
    right: -95px;
    bottom: 25px;
    width: 260px;
    height: 260px;
    opacity: 0.4;
  }
`;

export const TeamSection = styled.section`
  position: relative;
  padding: 70px 0 90px;
  background:
    linear-gradient(rgba(59, 177, 111, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(59, 177, 111, 0.035) 1px, transparent 1px),
    var(--gallery-bg-deep);
  background-size: 42px 42px;
`;

export const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 1050px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const TeamCard = styled.article`
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--gallery-border);
  border-radius: 14px;
  background: rgba(4, 28, 18, 0.9);
  box-shadow: inset 0 1px 0 rgba(144, 244, 180, 0.035);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    transform: translateY(-3px);
    border-color: var(--gallery-border-strong);
    box-shadow: 0 16px 45px rgba(0, 0, 0, 0.2);
  }
`;

export const CardVisual = styled.div`
  position: relative;
  height: 190px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 58%, rgba(33, 198, 105, 0.23), transparent 35%),
    linear-gradient(145deg, #0a3826 0%, #06291d 48%, #03180f 100%);

  @media (max-width: 760px) {
    height: 160px;
  }

  @media (max-width: 480px) {
    height: 190px;
  }
`;

export const CardContent = styled.div`
  position: relative;
  padding: 14px 14px 12px;

  h3 {
    margin: 0;
    color: var(--gallery-text);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  p {
    min-height: 38px;
    margin: 5px 0 10px;
    color: #8ca99c;
    font-size: 7.5px;
    line-height: 1.55;
  }
`;

export const CardPost = styled.div`
  margin-bottom: 5px;
  color: var(--gallery-green);
  font-size: 6.5px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid rgba(90, 210, 137, 0.1);
`;

export const Socials = styled.div`
  display: flex;
  gap: 5px;

  button {
    width: 22px;
    height: 22px;
    display: grid;
    place-items: center;
    padding: 0;
    border: 1px solid rgba(90, 210, 137, 0.13);
    border-radius: 6px;
    background: rgba(61, 182, 111, 0.06);
    color: #7ebf9a;
    cursor: pointer;
  }
`;

export const ImpactSection = styled.section`
  padding: 28px 0 35px;
  background: #062a1d;
`;

export const ImpactCard = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  border: 1px solid rgba(103, 228, 152, 0.18);
  border-radius: 17px;
  background: rgba(29, 126, 79, 0.18);
`;

export const LeadershipSection = styled.section`
  padding: 30px 0 70px;
  background: #062a1d;
`;

export const LeadershipCard = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  padding: 26px;
  border: 1px solid var(--gallery-border);
  border-radius: 16px;
  background: rgba(3, 24, 15, 0.55);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;
