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
            height: "calc(100vh - 300px)",
            // zIndex: 1100
          }}
        />
      </div>
      {/* Bottom bar */}
      <div>
        <aside
          style={{
            position: "fixed",
            left: 0,
            bottom: 0,
            width: "100%",
            height: 300,
            background: "#fff",
            boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
            zIndex: 1099,
            display: "flex",
            flexDirection: "column",
            padding: 32,
            color: '#111',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                  marginTop: idx === 0 ? 8 : 0
                }}
              >
                {msg.sender === 'ai' ? <b>AI Assistant:</b> : <b>You:</b>} {msg.text.replace(/^AI Assistant: /, '')}
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
              onChange={e => setChatInput(e.target.value)}
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
            >Send</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
