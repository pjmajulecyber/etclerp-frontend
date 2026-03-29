import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff } from "react-icons/fi";
import "./login.css";

import logo from "../../assets/logo.png";
import hero2 from "../../assets/login-image-2.jpg";
import hero3 from "../../assets/login-image-3.jpg";

import { useAuth } from "./AuthProvider";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export default function Login() {

  const navigate = useNavigate();
  const auth = useAuth();

  const slides = [hero2, hero3];

  const [index, setIndex] = useState(0);
  const slideTimer = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setIndex(i => (i + 1) % slides.length);
    }, 4000);

    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, [slides.length]);

  const handleDotClick = (i) => {
    setIndex(i);

    if (slideTimer.current) {
      clearInterval(slideTimer.current);
      slideTimer.current = setInterval(() => {
        setIndex(j => (j + 1) % slides.length);
      }, 4000);
    }
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);
    setError(null);

    try {

      const response = await fetch(`${API_BASE}/api/token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: username,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // 🔐 STORE TOKENS (Fix for 401 issues)
      localStorage.setItem("access", data.access);
      localStorage.setItem("refresh", data.refresh);

      auth.login({
        token: data.access
      });

      navigate("/admin/dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }

  };

  return (

    <div className="login-container"> 
    <div className="erplogin-page">
     
      <div
        className="rnylogin-left"
        onMouseEnter={() => {
          if (slideTimer.current) clearInterval(slideTimer.current);
        }}
        onMouseLeave={() => {
          if (slideTimer.current) clearInterval(slideTimer.current);
          slideTimer.current = setInterval(() => {
            setIndex(i => (i + 1) % slides.length);
          }, 4000);
        }}
      >

       

        <div className="rnlogin-heroWrap">
          {slides.map((s, i) => (
            <img
              key={i}
              src={s}
              className={`rnlogin-hero ${i === index ? "login-active" : ""}`}
              alt=""
            />
          ))}
        </div>

        <div className="rnlogin-overlay">

          <div className="rnlogin-sliderDots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`rnlogin-dot ${i === index ? "login-active" : ""}`}
                onClick={() => handleDotClick(i)}
                type="button"
              />
            ))}
          </div>

        </div>
      </div>

      <div className="rnlogin-right">

        <div className="rnlogin-formCard">

          <h2>Where Quality Matters!</h2>
          <p className="rnlogin-sub">Welcom Evosha Team, Login !</p>

          {error && <div className="login-error">{error}</div>}

          <form className="rnlogin-form" onSubmit={handleSubmit}>

            <label>User Name</label>
            <div className="rnlogin-passwordWrap">
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <label>Password</label>

            <div className="rnlogin-passwordWrap">

              <input
                type={showPassword ? "text" : "password"}
                placeholder="passward"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <button
                type="button"
                className="rnlogin-eyeBtn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>

            </div>

            <div className="rnlogin-rowOptions">
              <label className="rnlogin-remember">
                <input type="checkbox" /> Remember Me
              </label>
              <a className="rnlogin-forgot">Forgot Password?</a>
            </div>

            <button className="rnlogin-submit" type="submit">
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

        </div>
      </div>
      </div>
      </div>
  );
} 