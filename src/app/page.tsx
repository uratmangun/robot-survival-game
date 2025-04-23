"use client";
import React, { useEffect, useRef, useState } from "react";

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarOpen = true;

  useEffect(() => {
    let game: any;
    let enable3d: any, Scene3D: any, Canvas: any, Phaser: any;

    const loadPhaserAndEnable3D = async () => {
      Phaser = await import("phaser");
      const enable3dMod = await import("@enable3d/phaser-extension");
      enable3d = enable3dMod.enable3d;
      Scene3D = enable3dMod.Scene3D;
      Canvas = enable3dMod.Canvas;

      class MainScene extends Scene3D {
        constructor() {
          super({ key: "MainScene" });
        }

        init() {
          this.accessThirdDimension();
        }

        create() {
          this.third.warpSpeed();
          this.third.physics.add.box();
          // Zoom the camera out so the block is clearly visible
          this.third.camera.position.z += 10;
          this.third.camera.position.y += 10;
          console.log(this)
          const resize = () => {
          
       console.log(window.innerHeight)
            this.renderer.canvas.width = window.innerWidth;
            this.renderer.canvas.height = window.innerHeight;
          }

          window.onresize = resize
          resize()
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
        // Disable Web Audio to avoid 'Cannot resume a closed AudioContext' error
        audio: { noAudio: true },
        transparent: true,
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: window.innerWidth ,
          height: window.innerHeight 
        },
        scene: MainScene,
        parent: containerRef.current!,
        ...Canvas()
      };

      if (containerRef.current) {
        enable3d(() => game = new Phaser.Game(config)).withPhysics("/lib/ammo/kripken");
      }
    };

    if (typeof window !== "undefined") {
      loadPhaserAndEnable3D();
    }

    return () => {
      if (game && game.destroy) game.destroy(true);
    };
  }, []);

  // --- Chat State ---
  type Message = { sender: string; text: string };

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'list' | 'leaderboard'>("chat");
  const [playerName, setPlayerName] = useState<string>("");
  const [started, setStarted] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [bottomHeight, setBottomHeight] = useState<number>(300);
  const isResizing = useRef<boolean>(false);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const input = chatInput.trim();
    if (!input) return;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: input },
      { sender: "ai", text: `AI Assistant: You said "${input}"` }
    ]);
    setChatInput("");
  }

  function handleStart() {
    if (!playerName.trim()) return;
    console.log(`Starting game for ${playerName}`);
    setStarted(true);
  }

  function handleLogout() {
    setStarted(false);
    setPlayerName("");
    setActiveTab('chat');
    setMessages([]);
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current) return;
      const newHeight = window.innerHeight - e.clientY;
      setBottomHeight(Math.max(100, Math.min(window.innerHeight - 50, newHeight)));
    }
    function onMouseUp() { isResizing.current = false; }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top/main content */}
      <div style={{ flex: 1, position: "relative" }}>
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: `calc(100vh - ${bottomHeight}px)`,
            // zIndex: 1100
          }}
        />
      </div>
      {/* Bottom bar */}
      <div>
        <div
          style={{
            position: 'fixed',
            bottom: bottomHeight,
            left: 0,
            height: 6,
            width: '100%',
            cursor: 'row-resize',
            background: '#ddd',
            zIndex: 1000,
          }}
          onMouseDown={() => { isResizing.current = true; }}
        />
        <aside
          style={{
            position: "fixed",
            left: 0,
            bottom: 0,
            width: "100%",
            height: bottomHeight,
            background: "#fff",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
            zIndex: 1099,
            display: "flex",
            flexDirection: "column",
            padding: 32,
            color: "#111",
          }}
        >
          {!started && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <label className="label">
                <span className="label-text font-bold">Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleStart(); } }}
                className="input input-bordered border-black bg-white w-full max-w-xs"
                style={{ maxWidth: 300 }}
              />
              <button className="btn btn-success mt-2" onClick={handleStart}>
                Start
              </button>
            </div>
          )}
          {started && (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="btn-group">
                  <button
                    className={`btn mx-1 ${activeTab === 'chat' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('chat')}
                  >
                    Chat
                  </button>
                  <button
                    className={`btn mx-1 ${activeTab === 'list' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('list')}
                  >
                    List Enemies
                  </button>
                  <button
                    className={`btn mx-1 ${activeTab === 'leaderboard' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('leaderboard')}
                  >
                    Leaderboard
                  </button>
                </div>
                <button className="btn btn-outline btn-error" onClick={handleLogout}>
                  Logout
                </button>
              </div>
              {activeTab === 'chat' ? (
                <>
                  <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {messages.map((msg, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          background: msg.sender === 'user' ? '#222' : '#f1f1f1',
                          color: msg.sender === 'user' ? '#fff' : '#222',
                          borderRadius: '16px',
                          padding: '12px 18px',
                          maxWidth: '85%',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          marginTop: idx === 0 ? 8 : 0,
                        }}
                      >
                        {msg.sender === 'ai' ? <b>AI Assistant:</b> : <b>{playerName}:</b>} {msg.text.replace(/^AI Assistant: /, '')}
                      </div>
                    ))}
                  </div>
                  <form
                    style={{
                      borderTop: '1px solid #eee',
                      paddingTop: 16,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      background: '#fff',
                    }}
                    onSubmit={handleSend}
                  >
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: 10,
                        border: '1px solid #ccc',
                        borderRadius: 6,
                        fontSize: 15,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '8px 18px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#222',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Send
                    </button>
                  </form>
                </>
              ) : activeTab === 'list' ? (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>No enemies found.</div>
                </div>
              ) : activeTab === 'leaderboard' ? (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>Leaderboard content goes here.</div>
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
