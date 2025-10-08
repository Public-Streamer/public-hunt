import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Play,
  User,
  Menu,
  LogOut,
  Zap,
  DollarSign,
  Triangle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppContext } from "@/contexts/AppContext";
import MobileNav from "./MobileNav";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { brandMode } from "@/lib/brand";

interface HeaderProps {
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, currentUserProfile, logout, isAuthenticated } = useAppContext();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isDoghuntMode = brandMode === "doghunt";

  // Animation cycling state (0: strobe triangle, 1: sparks, 2: lightning, 3: energy pulse)
  const [animationIndex, setAnimationIndex] = useState(0);

  // Cycle through animations every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationIndex((prev) => (prev + 1) % 4);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Animation component that cycles between different effects
  const AnimatedConnector = ({ isMobile }: { isMobile: boolean }) => {
    const containerClass = isMobile ? "mx-0.5 flex-shrink-0" : "mx-1";
    const sparkClass = isMobile ? "h-1 w-1" : "h-1.5 w-1.5";

    switch (animationIndex) {
      case 0: // Static triangle (strobe animation disabled for performance)
        return (
          <Triangle
            className={`text-yellow-400 ${
              isMobile ? "h-1.5 w-1.5" : "h-2 w-2"
            } ${containerClass} rotate-90 stroke-[3]`}
            style={{
              filter:
                "drop-shadow(2px 2px 4px rgba(0,0,0,0.7)) brightness(1.3)",
              // Removed strobe animation that was causing performance issues
            }}
          />
        );

      case 1: // Flying sparks
        return (
          <div
            className={`relative ${containerClass} ${
              isMobile ? "w-4 h-2" : "w-6 h-3"
            }`}
          >
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute ${sparkClass} bg-yellow-400 rounded-full`}
                  style={{
                    left: "0%",
                    top: `${20 + i * 10}%`,
                    filter: "drop-shadow(0 0 4px rgba(255, 255, 0, 0.8))",
                    animation: `sparkFly 2s ease-in-out infinite ${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 2: // Lightning bolts
        return (
          <div
            className={`relative ${containerClass} ${
              isMobile ? "w-4 h-2" : "w-6 h-3"
            }`}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 24 12"
              style={{ filter: "drop-shadow(0 0 6px rgba(255, 255, 0, 0.9))" }}
            >
              <path
                d="M2 6 L8 2 L6 6 L10 4 L8 8 L12 6 L18 3 L16 7 L22 6"
                stroke="rgb(255, 255, 0)"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  animation: "lightningFlicker 1.8s ease-in-out infinite",
                }}
              />
            </svg>
          </div>
        );

      case 3: // Energy pulse
        return (
          <div
            className={`relative ${containerClass} ${
              isMobile ? "w-4 h-2" : "w-6 h-3"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`${
                  isMobile ? "w-2 h-2" : "w-3 h-3"
                } bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full`}
                style={{
                  filter: "drop-shadow(0 0 8px rgba(255, 165, 0, 0.8))",
                  animation: "energyPulse 2.5s ease-in-out infinite",
                }}
              />
              <div
                className={`absolute ${
                  isMobile ? "w-1 h-1" : "w-2 h-2"
                } bg-white rounded-full`}
                style={{ animation: "energyCore 2.5s ease-in-out infinite" }}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg sticky top-0 z-40 w-full">
        <div className="container mx-auto px-4 py-4">
          {isMobile ? (
            // Mobile layout: Logo left, Menu center, Login right
            <div className="flex items-center justify-between gap-2">
              {/* Left: Large Logo that scales down proportionally */}
              <Link
                to="/"
                className="flex items-center space-x-2 flex-shrink-0 min-w-0 max-w-[65%]"
              >
                <div
                  className="relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group p-3 w-14 h-14 flex-shrink-0"
                  style={{ filter: "drop-shadow(3px 3px 6px rgba(0,0,0,0.6))" }}
                >
                  {/* Main Play Button with flanking icons - keep desktop proportions */}
                  <div className="relative z-10 flex items-center justify-center h-full">
                    {/* Lightning bolt to the left of triangle */}
                    <Zap
                      className="text-yellow-300 animate-pulse h-2.5 w-2.5 mr-1"
                      style={{
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                        animationDuration: "0.8s",
                      }}
                    />

                    {isDoghuntMode ? (
                      <img
                        className="h-8 w-8"
                        src="dogLogo.png"
                        alt="Doghunt Logo"
                      />
                    ) : (
                      <Play
                        className="text-white h-8 w-8"
                        style={{
                          filter: "drop-shadow(3px 3px 6px rgba(0,0,0,0.7))",
                        }}
                      />
                    )}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 to-transparent opacity-40 pointer-events-none"></div>

                    {/* Dollar sign to the right of triangle */}
                    <DollarSign
                      className="text-green-300 animate-pulse h-2.5 w-2.5 ml-1"
                      style={{
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                        animationDuration: "1.2s",
                      }}
                    />
                  </div>

                  {/* Subtle Strobe Effect */}
                  <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300"></div>

                  {/* Live Indicator */}
                  <div
                    className="absolute -top-1.5 -right-1.5 flex items-center space-x-1 bg-red-500 text-white rounded-full animate-pulse text-xs px-1.5 py-0.5"
                    style={{
                      filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.6))",
                    }}
                  >
                    <div className="bg-white rounded-full w-1.5 h-1.5"></div>
                    <span className="font-bold">LIVE</span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  {isDoghuntMode ? (
                    <div className="flex flex-col">
                      <span
                        className="font-orbitron font-black text-white tracking-wide text-xl leading-tight"
                        style={{
                          textShadow:
                            "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                        }}
                      >
                        Dog
                      </span>
                      <span
                        className="font-orbitron font-black text-white tracking-wide text-xl leading-tight -mt-1"
                        style={{
                          textShadow:
                            "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                        }}
                      >
                        Hunt.tv
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span
                        className="font-orbitron font-black text-white tracking-wide text-xl leading-tight"
                        style={{
                          textShadow:
                            "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                        }}
                      >
                        Public
                      </span>
                      <span
                        className="font-orbitron font-black text-white tracking-wide text-xl leading-tight -mt-1"
                        style={{
                          textShadow:
                            "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                        }}
                      >
                        Streamer
                      </span>
                    </div>
                  )}
                  <div
                    className="flex items-center space-x-1 text-white/80 font-medium text-xs overflow-hidden mt-1 min-w-0"
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                  >
                    <Zap
                      className="text-yellow-300 h-2.5 w-2.5 flex-shrink-0"
                      style={{
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                      }}
                    />
                    <span className="whitespace-nowrap text-[10px] sm:text-xs">
                      Stream Live
                    </span>
                    {/* <div className="flex-shrink-0 mx-0.5">
                      <AnimatedConnector isMobile={true} />
                    </div> */}

                    <Play
                      className="text-yellow-300 h-2.5 w-2.5 flex-shrink-0"
                      style={{
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                      }}
                    />

                    <span className="whitespace-nowrap text-[10px] sm:text-xs">
                      & Earn
                    </span>
                    <DollarSign
                      className="text-green-300 h-2.5 w-2.5 flex-shrink-0"
                      style={{
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                      }}
                    />
                  </div>
                </div>
              </Link>

              {/* Right: Login/Profile */}

              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/30 shadow-md"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                {isAuthenticated && user && currentUserProfile ? (
                  <>
                    <Link
                      to={`/profile/${user.id}`}
                      className="flex items-center hover:bg-white/20 rounded-lg transition-colors space-x-1 p-1"
                    >
                      <Avatar className="h-7 w-7">
                        <AvatarImage
                          src={currentUserProfile.profile_picture_url}
                        />
                        <AvatarFallback className="bg-white text-purple-600 text-sm">
                          {currentUserProfile.display_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    {/* <TooltipWrapper content="Sign out of your account">
                      <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/30">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipWrapper> */}
                  </>
                ) : (
                  <TooltipWrapper content="Sign in to your account or create a new one">
                    <Button
                      onClick={onLoginClick}
                      className="bg-white/20 text-white hover:bg-white/30 border border-white/40 shadow-md backdrop-blur-sm text-sm px-3 py-2"
                      style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                    >
                      <User className="h-4 w-4 mr-1" />
                      {/* <span className="font-medium">Login</span> */}
                    </Button>
                  </TooltipWrapper>
                )}
              </div>
            </div>
          ) : (
            // Desktop layout: Original layout
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link to="/" className="flex items-center space-x-3">
                  <div
                    className="relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group p-4 py-6"
                    style={{
                      filter: "drop-shadow(4px 4px 8px rgba(0,0,0,0.6))",
                    }}
                  >
                    {/* Main Play Button with flanking icons */}
                    <div className="relative z-10 flex items-center justify-center h-full">
                      {/* Lightning bolt to the left of triangle */}
                      <Zap
                        className="text-yellow-300 animate-pulse h-3 w-3 "
                        style={{
                          filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                          animationDuration: "0.8s",
                        }}
                      />

                      {isDoghuntMode ? (
                        <img
                          className="h-10"
                          src="/dogLogo.png"
                          alt="Doghunt Logo"
                        />
                      ) : (
                        <Play
                          className="text-white h-10 w-10"
                          style={{
                            filter: "drop-shadow(3px 3px 6px rgba(0,0,0,0.7))",
                          }}
                        />
                      )}

                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 to-transparent opacity-40 pointer-events-none"></div>

                      {/* <Crosshair className=" absolute   bottom-3 right-4 w-2 h-2   " /> */}
                      {/* Dollar sign to the right of triangle */}
                      <DollarSign
                        className="text-green-300 animate-pulse h-3 w-3 ml-1"
                        style={{
                          filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                          animationDuration: "1.2s",
                        }}
                      />
                    </div>
                    {/* Subtle Strobe Effect */}
                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300"></div>
                    {/* Live Indicator */}
                    <div
                      className="absolute -top-2 -right-2 flex items-center space-x-1 bg-red-500 text-white rounded-full animate-pulse text-xs px-2 py-1"
                      style={{
                        filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.6))",
                      }}
                    >
                      <div className="bg-white rounded-full w-2 h-2"></div>
                      <span className="font-bold">LIVE</span>
                    </div>
                  </div>

                  {isDoghuntMode ? (
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex flex-col">
                        <span
                          className="font-orbitron font-black text-white tracking-wide text-2xl leading-tight"
                          style={{
                            textShadow:
                              "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                          }}
                        >
                          Dog
                        </span>
                        <span
                          className="font-orbitron font-black text-white tracking-wide text-2xl leading-tight -mt-1"
                          style={{
                            textShadow:
                              "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                          }}
                        >
                          Hunt.tv
                        </span>
                      </div>
                      <span className="relative inline-block w-[max-content]  text-xs text-white/80 whitespace-nowrap [clip-path:inset(0_100%_0_0)] will-change-[clip-path] animate-typewriter">
                        by public streamer
                      </span>
                      <div
                        className="flex space-x-1 text-white/80 font-medium text-sm mt-1"
                        style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                      >
                        <div className="flex items-center space-x-1">
                          <Zap
                            className="text-yellow-300 h-4 w-4"
                            style={{
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                            }}
                          />

                          <span className="whitespace-nowrap">Stream Live</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {/* <AnimatedConnector isMobile={false} /> */}

                          <Triangle
                            className="rotate-90 text-yellow-300 h-4 w-4"
                            style={{
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                            }}
                          />
                          <span className="whitespace-nowrap">
                            Hunt & Earn{" "}
                          </span>
                          <DollarSign
                            className="text-green-300 h-4 w-4"
                            style={{
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex flex-col">
                        <span
                          className="font-orbitron font-black text-white tracking-wide text-2xl leading-tight"
                          style={{
                            textShadow:
                              "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                          }}
                        >
                          Public
                        </span>
                        <span
                          className="font-orbitron font-black text-white tracking-wide text-2xl leading-tight -mt-1"
                          style={{
                            textShadow:
                              "3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)",
                          }}
                        >
                          Streamer
                        </span>
                      </div>
                      {/* <span className="relative inline-block w-[max-content]  text-xs text-white/80 whitespace-nowrap [clip-path:inset(0_100%_0_0)] will-change-[clip-path] animate-typewriter">
                        by public streamer
                      </span> */}
                      <div
                        className="flex space-x-1 text-white/80 font-medium text-sm mt-1"
                        style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}
                      >
                        <div className="flex items-center space-x-1">
                          <Zap
                            className="text-yellow-300 h-4 w-4"
                            style={{
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                            }}
                          />

                          <span className="whitespace-nowrap">Stream Live</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {/* <AnimatedConnector isMobile={false} /> */}

                          <Triangle
                            className="rotate-90 text-yellow-300 h-4 w-4"
                            style={{
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                            }}
                          />
                          <span className="whitespace-nowrap">& Earn </span>
                          <DollarSign
                            className="text-green-300 h-4 w-4"
                            style={{
                              filter:
                                "drop-shadow(2px 2px 4px rgba(0,0,0,0.7))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              </div>

              <nav className="hidden md:flex items-center space-x-2 lg:space-x-6">
                <TooltipWrapper content="Create your own channel and live streaming events">
                  <Link
                    to="/create"
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
                      isActive("/create")
                        ? "bg-red-600 border-red-500 shadow-red-400/30"
                        : "bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400"
                    }`}
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    Create
                  </Link>
                </TooltipWrapper>
                {/* <TooltipWrapper content="View and manage all streaming channels on the platform">
                  <Link
                    to="/channels"
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
                      isActive("/channels")
                        ? "bg-red-600 border-red-500 shadow-red-400/30"
                        : "bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400"
                    }`}
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    Channels
                  </Link>
                </TooltipWrapper> */}
                <TooltipWrapper content="Browse and join live streaming events">
                  <Link
                    to="/events"
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
                      isActive("/events")
                        ? "bg-red-600 border-red-500 shadow-red-400/30"
                        : "bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400"
                    }`}
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    Events
                  </Link>
                </TooltipWrapper>
                <TooltipWrapper content="Create and manage advertising campaigns">
                  <Link
                    to="/advertiser-dashboard"
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
                      isActive("/advertise")
                        ? "bg-red-600 border-red-500 shadow-red-400/30"
                        : "bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400"
                    }`}
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    Advertise
                  </Link>
                </TooltipWrapper>
                <TooltipWrapper content="Get help and learn about Public Streamer">
                  <Link
                    to="/qa"
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
                      isActive("/qa")
                        ? "bg-red-600 border-red-500 shadow-red-400/30"
                        : "bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400"
                    }`}
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    Q&A
                  </Link>
                </TooltipWrapper>
                <TooltipWrapper content="Get paid for your streaming events">
                  <Link
                    to="/payments"
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
                      isActive("/payments")
                        ? "bg-red-600 border-red-500 shadow-red-400/30"
                        : "bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400"
                    }`}
                    style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                  >
                    Payments
                  </Link>
                </TooltipWrapper>
              </nav>

              <div className="flex items-center space-x-2 lg:space-x-3 ml-2 lg:ml-8 flex-shrink-0">
                {isAuthenticated ? (
                  <>
                    <Link
                      to={`/profile/${user.id}`}
                      className="flex items-center hover:bg-white/20 rounded-lg transition-colors space-x-2 p-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={currentUserProfile?.profile_picture_url}
                        />
                        <AvatarFallback className="bg-white text-purple-600 text-sm">
                          {currentUserProfile?.display_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:flex text-sm">
                        {currentUserProfile?.display_name}
                      </span>
                    </Link>
                    <TooltipWrapper content="Sign out of your account">
                      <Button
                        onClick={logout}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/30"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipWrapper>
                  </>
                ) : (
                  <TooltipWrapper content="Sign in to your account or create a new one">
                    <Button
                      onClick={onLoginClick}
                      className="bg-white/20 text-white hover:bg-white/30 border border-white/40 shadow-md backdrop-blur-sm"
                      style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
                    >
                      <User className="h-4 w-4 mr-1" />
                      <span className=" font-medium">Login</span>
                    </Button>
                  </TooltipWrapper>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onLoginClick={onLoginClick}
      />
    </>
  );
};

export default Header;
