"use client";
import React, { useEffect, useRef, useState } from "react";

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sidebarOpen = true;
  const [started, setStarted] = useState<boolean>(false);
  const gameRef = useRef<any>(null);
  const robotSpeed = 0.1;
  const moveRobot = (dx: number, dz: number) => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene("MainScene");
    if (scene && scene.robot) {
      scene.robot.position.x += dx;
      scene.robot.position.z += dz;
      scene.robotBB.setFromObject(scene.robot);
    }
  };

  useEffect(() => {
    let game: any;
    let enable3d: any, Scene3D: any, Canvas: any, Phaser: any, ExtendedObject3D: any, THREE: any;

    const loadPhaserAndEnable3D = async () => {
      Phaser = await import("phaser");
      const enable3dMod = await import("@enable3d/phaser-extension");
      enable3d = enable3dMod.enable3d;
      Scene3D = enable3dMod.Scene3D;
      Canvas = enable3dMod.Canvas;
      ExtendedObject3D = enable3dMod.ExtendedObject3D;

      // import Three.js for bounding box calculations
      const THREEModule = await import("three");
      THREE = THREEModule;

      class MainScene extends Scene3D {
        boxMan: any;
        robot: any;
        robotBB: any;
        keys: any;
        constructor() {
          super({ key: "MainScene" });
        }

        init() {
          this.accessThirdDimension();
        }

        async create() {
          this.third.warpSpeed();
          // Zoom the camera out so the block is clearly visible
          this.third.camera.position.z += 10;
          this.third.camera.position.y += 10;
          // Load box_man via enable3d loader and setup animations
          this.third.load.gltf(String('/glb/box_man.glb')).then((object: any) => {
            const man = object.scene.children[0];
            this.boxMan = new ExtendedObject3D();
            this.boxMan.name = 'box_man';
            this.boxMan.add(man);
            // scale model to match physics box size
            const bbox = new THREE.Box3().setFromObject(this.boxMan);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            this.boxMan.scale.setScalar(1 / maxDim);
            this.boxMan.position.set(-5, 0, 0);
            this.third.add.existing(this.boxMan);
            // initial idle facing: negative Z
            this.boxMan.rotation.y = Math.PI;
            // store rotation offset for dynamic facing
            this.boxMan.userData.rotOffset = this.boxMan.rotation.y;
            // setup animations per example
            this.third.animationMixers.add(this.boxMan.animation.mixer);
            object.animations.forEach((clip: any) => {
              if (clip.name) this.boxMan.animation.add(clip.name, clip);
            });
            // find and store idle and run animations (match 'idle' or 'run'/'walk')
            const idleClip = object.animations.find((c: any) => /idle/i.test(c.name));
            const runClip = object.animations.find((c: any) => /(run|walk)/i.test(c.name));
            const idleName = idleClip?.name;
            const runName = runClip?.name;
            // find open door animations (right and left)
            const doorRightClip = object.animations.find((c: any) => /open_door_standing_right/i.test(c.name));
            const doorLeftClip = object.animations.find((c: any) => /open_door_standing_left/i.test(c.name));
            const doorRightName = doorRightClip?.name;
            const doorLeftName = doorLeftClip?.name;
            const doorRightDuration = doorRightClip?.duration || 0;
            const doorLeftDuration = doorLeftClip?.duration || 0;
            console.log(object.animations)
            this.boxMan.userData.idleName = idleName;
            this.boxMan.userData.runName = runName;
            this.boxMan.userData.doorRightName = doorRightName;
            this.boxMan.userData.doorLeftName = doorLeftName;
            this.boxMan.userData.doorRightDuration = doorRightDuration;
            this.boxMan.userData.doorLeftDuration = doorLeftDuration;
            this.boxMan.userData.isDoorPlaying = false;
            this.boxMan.userData.currentAnim = idleName;
            // play idle by default
            if (idleName) this.boxMan.animation.play(idleName);
          });
          // Load robot via enable3d loader
          this.third.load.gltf(String('/glb/robot.glb')).then((object: any) => {
            const robot = object.scene.children[0];
            const robotObject = new ExtendedObject3D();
            robotObject.name = 'robot';
            robotObject.add(robot);
            // scale model to match physics box size
            const bbox = new THREE.Box3().setFromObject(robotObject);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            robotObject.scale.setScalar(1 / maxDim);
            robotObject.position.set(5, 0, 0);
            this.third.add.existing(robotObject);
            // setup idle animation for robot
            this.third.animationMixers.add(robotObject.animation.mixer);
            object.animations.forEach((clip: any) => {
              if (clip.name) robotObject.animation.add(clip.name, clip);
            });
            const idleClip = object.animations.find((c: any) => /idle/i.test(c.name));
            const idleName = idleClip?.name;
            console.log(object.animations)
            robotObject.userData.idleName = idleName;
            if (idleName) robotObject.animation.play(idleName);
            this.robot = robotObject;
            this.robotBB = new THREE.Box3().setFromObject(robotObject);
          });
          // setup WASD controls for boxMan
          this.keys = this.input.keyboard.addKeys({ W: 'W', A: 'A', S: 'S', D: 'D', F: 'F' });
        }
        update() {
          // update robot bounding box in case it moved
          if (this.robot) this.robotBB.setFromObject(this.robot);
          if (this.boxMan && this.keys) {
            // door animation on F key: choose left or right
            if (this.keys.F.isDown && !this.boxMan.userData.isDoorPlaying) {
              const useLeft = Math.random() < 0.5;
              const doorName = useLeft ? this.boxMan.userData.doorLeftName : this.boxMan.userData.doorRightName;
              const doorDuration = useLeft ? this.boxMan.userData.doorLeftDuration : this.boxMan.userData.doorRightDuration;
              if (doorName) {
                this.boxMan.animation.play(doorName);
                this.boxMan.userData.currentAnim = doorName;
                this.boxMan.userData.isDoorPlaying = true;
                // push robot if hand overlaps
                const manBB = new THREE.Box3().setFromObject(this.boxMan);
                if (this.robot) {
                  // expand robot bounding box to give some tolerance
                  const proximityBB = this.robotBB.clone().expandByScalar(1);
                  if (manBB.intersectsBox(proximityBB)) {
                    const pushDir = new THREE.Vector3().subVectors(this.robot.position, this.boxMan.position).normalize();
                    this.robot.position.add(pushDir.multiplyScalar(0.5));
                    this.robotBB.setFromObject(this.robot);
                  }
                }
                setTimeout(() => {
                  this.boxMan.userData.isDoorPlaying = false;
                }, doorDuration * 1000);
              }
            }
            const speed = 0.1;
            // compute movement vector
            let dx = 0, dz = 0;
            if (this.keys.W.isDown) dz -= speed;
            if (this.keys.S.isDown) dz += speed;
            if (this.keys.A.isDown) dx -= speed;
            if (this.keys.D.isDown) dx += speed;
            const moving = dx !== 0 || dz !== 0;
            // apply movement
            if (moving) {
              const manBB = new THREE.Box3().setFromObject(this.boxMan);
              let allowX = true;
              let allowZ = true;
              // check X axis
              if (dx !== 0) {
                const bbX = manBB.clone().translate(new THREE.Vector3(dx, 0, 0));
                if (this.robotBB && bbX.intersectsBox(this.robotBB)) allowX = false;
              }
              // check Z axis
              if (dz !== 0) {
                const bbZ = manBB.clone().translate(new THREE.Vector3(0, 0, dz));
                if (this.robotBB && bbZ.intersectsBox(this.robotBB)) allowZ = false;
              }
              // apply valid movement
              if (allowX) this.boxMan.position.x += dx;
              if (allowZ) this.boxMan.position.z += dz;
              // face direction if moved
              if (allowX || allowZ) {
                const offset = this.boxMan.userData.rotOffset || 0;
                this.boxMan.rotation.y = offset + Math.atan2(-dx, -dz);
              }
            }
            // toggle animations
            const { idleName, runName, currentAnim } = this.boxMan.userData;
            if (!moving && idleName && currentAnim !== idleName) {
              this.boxMan.animation.play(idleName);
              this.boxMan.userData.currentAnim = idleName;
            } else if (moving && runName && currentAnim !== runName) {
              this.boxMan.animation.play(runName);
              this.boxMan.userData.currentAnim = runName;
            }
          }
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
        enable3d(() => { game = new Phaser.Game(config); gameRef.current = game; return game; }).withPhysics("/lib/ammo/kripken");
      }
    };

    // start Phaser only after user clicks Start
    if (typeof window !== "undefined" && started) {
      loadPhaserAndEnable3D();
    }

    return () => {
      if (game && game.destroy) game.destroy(true);
    };
  }, [started]);

  // --- Chat State ---
  type Message = { sender: string; text: string };

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'list' | 'leaderboard' | 'movement'>("chat");
  const [playerName, setPlayerName] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
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
    // generate session id
    const id = Math.random().toString(36).substring(2, 8);
    setSessionId(id);
    console.log(`Starting game for ${playerName}`);
    setStarted(true);
    // Reset bottom bar to original height of 300px
    setBottomHeight(300);
  }

  function handleLogout() {
    setStarted(false);
    setPlayerName("");
    setSessionId("");
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
            height: started ? bottomHeight : '75vh',
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
              <img src="/title.png" alt="Title" className="mb-2" style={{ maxWidth: 200 }} />
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
              <div className="flex items-center mb-4">
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
                  <button
                    className={`btn mx-1 ${activeTab === 'movement' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('movement')}
                  >
                    Movement
                  </button>
                </div>
                <span className="ml-auto mr-2 font-bold">{`${playerName}-${sessionId}`}</span>
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
              ) : activeTab === 'movement' ? (
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <button className="btn mb-2" onClick={() => moveRobot(0, -robotSpeed)}>Up</button>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <button className="btn" onClick={() => moveRobot(-robotSpeed, 0)}>Left</button>
                    <button className="btn" onClick={() => moveRobot(robotSpeed, 0)}>Right</button>
                  </div>
                  <button className="btn" onClick={() => moveRobot(0, robotSpeed)}>Down</button>
                  <button className="btn">Punch</button>
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
