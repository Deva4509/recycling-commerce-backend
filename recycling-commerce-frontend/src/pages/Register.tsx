import { FormEvent, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agreed) {
      setError("Please accept the Terms of Service and Privacy Policy.");
      return;
    }

    const result = await register(name, email, password);

    if (!result.success) {
      setError(result.error || "Unable to create your account.");
      return;
    }

    setError("");
    navigate("/", { replace: true });
  }

  return (
    <main className="auth-page register-page">
      <section className="auth-visual register-visual">
        <div className="auth-visual-glow auth-glow-one" />
        <div className="auth-visual-glow auth-glow-two" />

        <Link to="/" className="auth-brand">
          <span><Leaf size={18} /></span>
          Green<span>Core</span>
        </Link>

        <div className="auth-visual-content">
          <div className="auth-orbit auth-orbit-one" />
          <div className="auth-orbit auth-orbit-two" />

          <div className="auth-leaf-core">
            <Leaf size={54} strokeWidth={1.15} />
          </div>

          <div className="auth-floating-card auth-float-top">
            <Check size={14} />
            <span>Conscious shopping</span>
          </div>

          <div className="auth-floating-card auth-float-bottom">
            <strong>01</strong>
            <span>Small choices matter</span>
          </div>
        </div>

        <div className="auth-visual-copy">
          <span>JOIN THE MOVEMENT</span>
          <h1>
            Shop with
            <br />
            <em>purpose.</em>
          </h1>
          <p>
            Create your account and discover products designed around reuse,
            recovery and responsible consumption.
          </p>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <Link to="/" className="auth-brand dark-brand">
              <span><Leaf size={18} /></span>
              Green<span>Core</span>
            </Link>
          </div>

          <div className="auth-heading">
            <span className="auth-form-label">GET STARTED</span>
            <h2>Create your account.</h2>
            <p>Join GreenCore and start shopping more consciously.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Full name
              <div className="auth-input">
                <UserRound size={16} />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </label>

            <label>
              Email address
              <div className="auth-input">
                <Mail size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </label>

            <label>
              Password
              <div className="auth-input">
                <LockKeyhole size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="terms-option">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>
                I agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit">
              Create account
              <ArrowRight size={16} />
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>

          <p className="auth-terms">
            Your account is securely connected to your GreenCore account.
          </p>
        </div>
      </section>
    </main>
  );
}
