"use client";
import React, { useEffect, useRef, useState } from "react";
import { Box3, Vector3 } from "three";

// Define chat message types, including function call messages
type Message =
  | { sender: 'user'; text: string }
  | { sender: 'ai'; text: string }
  | { sender: 'ai_tool'; functionName: string; toolArgs: any };

export default function Page() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [started, setStarted] = useState<boolean>(false);
  const gameRef = useRef<any>(null);
  const robotSpeed = 0.1;
  const pendingMoveRef = useRef<{dx: number; dz: number; hasPending: boolean}>({dx: 0, dz: 0, hasPending: false});
  const processPendingMove = () => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene("MainScene");
    if (!scene || !scene.robot) return;
    if (scene.robot.userData.isPunching) {
      scene.robot.animation.mixer.stopAllAction();
      scene.robot.userData.isPunching = false;
      scene.robot.userData.pendingPunchCount = 0;
    }
    if (!pendingMoveRef.current.hasPending) {
      scene.robot.userData.isMoving = false;
      const idleName = scene.robot.userData.idleName;
      if (idleName) scene.robot.animation.play(idleName);
      return;
    }
    const {dx, dz} = pendingMoveRef.current;
    pendingMoveRef.current.hasPending = false;
    if (dx > 0) scene.robot.rotation.y = Math.PI / 2;
    else if (dx < 0) scene.robot.rotation.y = -Math.PI / 2;
    else if (dz > 0) scene.robot.rotation.y = 0;
    else if (dz < 0) scene.robot.rotation.y = Math.PI;
    const nextBB = scene.robotBB.clone().translate(new Vector3(dx, 0, dz)).expandByScalar(-0.2);
    const boxManBB = new Box3().setFromObject(scene.boxMan).expandByScalar(0.2);
    if (!nextBB.intersectsBox(boxManBB)) {
      scene.robot.position.x += dx * 2;
      scene.robot.position.z += dz * 2;
      scene.robotBB.setFromObject(scene.robot).expandByScalar(-0.2);
    }
    scene.robot.userData.isMoving = true;
    const runName = scene.robot.userData.runName || "Running";
    const duration = scene.robot.userData.runDuration || 0;
    const action = scene.robot.animation.play(runName);
    setTimeout(() => {
      if (action) action.stop();
      processPendingMove();
    }, duration * 1000);
  };
  const moveRobot = (dx: number, dz: number) => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene("MainScene");
    if (scene && scene.robot) {
      if (scene.robot.userData.isPunching) {
        // interrupt punch when moving
        scene.robot.animation.mixer.stopAllAction();
        scene.robot.userData.isPunching = false;
        scene.robot.userData.pendingPunchCount = 0;
      }
      pendingMoveRef.current = {dx, dz, hasPending: true};
      processPendingMove();
    }
  };
  const punchRobot = () => {
    setRobotAttack(prev => Math.max(prev - 1, 0));
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene("MainScene");
    if (scene && scene.robot) {
      if (scene.robot.userData.isMoving) {
        scene.robot.animation.mixer.stopAllAction();
        scene.robot.userData.isMoving = false;
        pendingMoveRef.current.hasPending = false;
      }
      const punchName = scene.robot.userData.punchName;
      const punchDuration = scene.robot.userData.punchDuration || 0;
      if (punchName) {
        if (!scene.robot.userData.isPunching) {
          const playNext = () => {
            scene.robot.userData.isPunching = true;
            const action = scene.robot.animation.play(punchName);
            if (action) action.timeScale = 3;
            // collision & damage
            scene.robotBB.setFromObject(scene.robot).expandByScalar(-0.2);
            const manBB = new Box3().setFromObject(scene.boxMan).expandByScalar(0.2);
            if (manBB.intersectsBox(scene.robotBB)) {
              const prevAtk = robotAttack;
              if (prevAtk > 0) {
                setBoxmanHealth(prev => { const h = prev - 1; if (h <= 0) scene.boxMan.visible = false; return h; });
                setMessages(prev => [...prev, { sender: 'ai', text: "You've been hit by robot" }]);
                const pushDir = new Vector3().subVectors(scene.boxMan.position, scene.robot.position).normalize();
                scene.boxMan.position.add(pushDir.multiplyScalar(robotSpeed * 5));
              }
            }
            setTimeout(() => {
              if (action) action.stop();
              if (scene.robot.userData.pendingPunchCount > 0) {
                scene.robot.userData.pendingPunchCount--;
                playNext();
              } else {
                scene.robot.userData.isPunching = false;
                const idleName = scene.robot.userData.idleName;
                if (idleName) scene.robot.animation.play(idleName);
              }
            }, punchDuration * 1000 / 3);
          };
          scene.robot.userData.pendingPunchCount = 0;
          playNext();
        } else {
          scene.robot.userData.pendingPunchCount = (scene.robot.userData.pendingPunchCount || 0) + 1;
        }
      }
    }
  };

  const moveBoxman = (dx: number, dz: number) => {
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene("MainScene");
    if (scene && typeof scene.moveBoxman === "function") {
      scene.moveBoxman(dx, dz);
    }
  };
  const punchBoxman = () => {
    setBoxmanAttack(prev => Math.max(prev - 1, 0));
    if (!gameRef.current) return;
    const scene = gameRef.current.scene.getScene("MainScene");
    if (scene && scene.boxMan) {
      if (scene.boxMan.userData.isDoorPlaying) return;
      const useLeft = Math.random() < 0.5;
      const doorName = useLeft ? scene.boxMan.userData.doorLeftName : scene.boxMan.userData.doorRightName;
      const doorDuration = useLeft ? scene.boxMan.userData.doorLeftDuration : scene.boxMan.userData.doorRightDuration;
      if (doorName) {
        const action = scene.boxMan.animation.play(doorName);
        scene.boxMan.userData.currentAnim = doorName;
        scene.boxMan.userData.isDoorPlaying = true;
        const manBB = new Box3().setFromObject(scene.boxMan).expandByScalar(0.2);
        if (scene.robot) {
          const proximityBB = scene.robotBB.clone().expandByScalar(0.5);
          if (manBB.intersectsBox(proximityBB)) {
            // push robot
            const pushDir = new Vector3().subVectors(scene.robot.position, scene.boxMan.position).normalize();
            scene.robot.position.add(pushDir.multiplyScalar(0.5));
            scene.robotBB.setFromObject(scene.robot).expandByScalar(-0.2);
            // decrease BoxMan attack and Robot health
            if (boxmanAttack > 0) {
              setRobotHealth(prev => { const nh = prev - 1; if (nh <= 0) scene.robot.visible = false; return nh; });
            }
          }
        }
        setTimeout(() => {
          if (action) action.stop();
          scene.boxMan.userData.isDoorPlaying = false;
          const idleName = scene.boxMan.userData.idleName;
          if (idleName) {
            scene.boxMan.animation.play(idleName);
            scene.boxMan.userData.currentAnim = idleName;
          }
        }, doorDuration * 1000);
      }
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

      const THREEModule = await import("three");
      THREE = THREEModule;

      class MainScene extends Scene3D {
        boxMan: any;
        robot: any;
        robotBB: any;

        constructor() {
          super({ key: "MainScene" });
        }

        init() {
          this.accessThirdDimension();
        }

        async create() {
          this.third.warpSpeed();
          this.third.camera.position.z += 10;
          this.third.camera.position.y += 10;
          this.third.load.gltf('/glb/box_man.glb').then((object: any) => {
            const man = object.scene.children[0];
            this.boxMan = new ExtendedObject3D();
            this.boxMan.name = 'box_man';
            this.boxMan.add(man);
            const bbox = new THREE.Box3().setFromObject(this.boxMan);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            this.boxMan.scale.setScalar(1 / maxDim);
            this.boxMan.position.set(-2, 0, 0);
            this.third.add.existing(this.boxMan);
            this.boxMan.rotation.y = Math.PI / 2;
            this.boxMan.userData.rotOffset = this.boxMan.rotation.y;
            this.third.animationMixers.add(this.boxMan.animation.mixer);
            object.animations.forEach((clip: any) => {
              if (clip.name) this.boxMan.animation.add(clip.name, clip);
            });
            const idleClip = object.animations.find((c: any) => /idle/i.test(c.name));
            const runClip = object.animations.find((c: any) => /(run|walk)/i.test(c.name));
            const doorRightClip = object.animations.find((c: any) => /open_door_standing_right/i.test(c.name));
            const doorLeftClip = object.animations.find((c: any) => /open_door_standing_left/i.test(c.name));
            const idleName = idleClip?.name;
            const runName = runClip?.name;
            const doorRightName = doorRightClip?.name;
            const doorLeftName = doorLeftClip?.name;
            const doorRightDuration = doorRightClip?.duration || 0;
            const doorLeftDuration = doorLeftClip?.duration || 0;
            this.boxMan.userData.idleName = idleName;
            this.boxMan.userData.runName = runName;
            this.boxMan.userData.runDuration = runClip?.duration || 0;
            this.boxMan.userData.doorRightName = doorRightName;
            this.boxMan.userData.doorLeftName = doorLeftName;
            this.boxMan.userData.doorRightDuration = doorRightDuration;
            this.boxMan.userData.doorLeftDuration = doorLeftDuration;
            this.boxMan.userData.isDoorPlaying = false;
            this.boxMan.userData.currentAnim = idleName;
            if (idleName) this.boxMan.animation.play(idleName);
          });
          this.third.load.gltf('/glb/robot.glb').then((object: any) => {
            const robot = object.scene.children[0];
            const robotObject = new ExtendedObject3D();
            robotObject.name = 'robot';
            robotObject.add(robot);
            const bbox = new THREE.Box3().setFromObject(robotObject);
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            robotObject.scale.setScalar(3 / maxDim);
            robotObject.position.set(2, 0, 0);
            this.third.add.existing(robotObject);
            robotObject.rotation.y = -Math.PI / 2;
            this.third.animationMixers.add(robotObject.animation.mixer);
            object.animations.forEach((clip: any) => {
              if (clip.name) robotObject.animation.add(clip.name, clip);
            });
            console.log(object.animations)
            const idleClip = object.animations.find((c: any) => /idle/i.test(c.name));
            const runClip = object.animations.find((c: any) => /Running/i.test(c.name));
            const punchClip = object.animations.find((c: any) => /Punch/i.test(c.name));
            const idleName = idleClip?.name;
            const runName = runClip?.name;
            const punchName = punchClip?.name;
            robotObject.userData.idleName = idleName;
            robotObject.userData.runName = runName;
            robotObject.userData.runDuration = runClip?.duration || 0;
            robotObject.userData.punchName = punchName;
            robotObject.userData.punchDuration = punchClip?.duration || 0;
            robotObject.userData.isMoving = false;
            robotObject.userData.isPunching = false;
            robotObject.userData.pendingPunchCount = 0;
            robotObject.userData.pendingMoveCount = 0;
            if (idleName) robotObject.animation.play(idleName);
            this.robot = robotObject;
            this.robotBB = new THREE.Box3().setFromObject(robotObject).expandByScalar(-0.2);
          });
        }
        update() {
          if (this.robot) this.robotBB.setFromObject(this.robot).expandByScalar(-0.2);
          // respawn boxMan to random position inside default ground if it leaves boundary
          if (this.boxMan) {
            const manBB = new THREE.Box3().setFromObject(this.boxMan);
            const boundary = 10;
            if (manBB.min.x > boundary || manBB.max.x < -boundary || manBB.min.z > boundary || manBB.max.z < -boundary) {
              const x = Math.random() * 2 * boundary - boundary;
              const z = Math.random() * 2 * boundary - boundary;
              this.boxMan.position.set(x, 0, z);
            }
          }
          // respawn robot to random position inside default ground if it leaves boundary
          if (this.robot) {
            const robotBB = new THREE.Box3().setFromObject(this.robot).expandByScalar(-0.2);
            const boundary = 10;
            if (robotBB.min.x > boundary || robotBB.max.x < -boundary || robotBB.min.z > boundary || robotBB.max.z < -boundary) {
              const xR = Math.random() * 2 * boundary - boundary;
              const zR = Math.random() * 2 * boundary - boundary;
              this.robot.position.set(xR, 0, zR);
              this.robotBB.setFromObject(this.robot).expandByScalar(-0.2);
            }
          }
        }
        // AI-driven boxMan controls
        moveBoxman(dx: number, dz: number) {
          if (!this.boxMan) return;
          const factor = 2;
          const moveX = dx * factor;
          const moveZ = dz * factor;
          const manBB = new THREE.Box3().setFromObject(this.boxMan).expandByScalar(0.2);
          let allowX = true, allowZ = true;
          if (dx !== 0) {
            const bbX = manBB.clone().translate(new THREE.Vector3(moveX, 0, 0));
            if (this.robotBB && bbX.intersectsBox(this.robotBB)) allowX = false;
          }
          if (dz !== 0) {
            const bbZ = manBB.clone().translate(new THREE.Vector3(0, 0, moveZ));
            if (this.robotBB && bbZ.intersectsBox(this.robotBB)) allowZ = false;
          }
          if (allowX) this.boxMan.position.x += moveX;
          if (allowZ) this.boxMan.position.z += moveZ;
          const moving = allowX || allowZ;
          // rotate BoxMan to face movement direction
          this.boxMan.rotation.y = Math.atan2(moveX, moveZ);
          const runName = this.boxMan.userData.runName;
          const idleName = this.boxMan.userData.idleName;
          if (moving && runName) {
            const action = this.boxMan.animation.play(runName);
            this.boxMan.userData.currentAnim = runName;
            const duration = this.boxMan.userData.runDuration || 0;
            setTimeout(() => {
              if (action) action.stop();
              if (idleName) {
                this.boxMan.animation.play(idleName);
                this.boxMan.userData.currentAnim = idleName;
              }
            }, duration * 1000);
          } else if (!moving && idleName) {
            if (this.boxMan.userData.currentAnim !== idleName) {
              this.boxMan.animation.play(idleName);
              this.boxMan.userData.currentAnim = idleName;
            }
          }
        }
        punchBoxman() {
          if (!this.boxMan || this.boxMan.userData.isDoorPlaying) return;
          const useLeft = Math.random() < 0.5;
          const doorName = useLeft ? this.boxMan.userData.doorLeftName : this.boxMan.userData.doorRightName;
          const doorDuration = useLeft ? this.boxMan.userData.doorLeftDuration : this.boxMan.userData.doorRightDuration;
          if (doorName) {
            const action = this.boxMan.animation.play(doorName);
            this.boxMan.userData.currentAnim = doorName;
            this.boxMan.userData.isDoorPlaying = true;
            const manBB = new THREE.Box3().setFromObject(this.boxMan).expandByScalar(0.2);
            if (this.robot) {
              const proximityBB = this.robotBB.clone().expandByScalar(0.5);
              if (manBB.intersectsBox(proximityBB)) {
                // push robot
                const pushDir = new THREE.Vector3().subVectors(this.robot.position, this.boxMan.position).normalize();
                this.robot.position.add(pushDir.multiplyScalar(0.5));
                this.robotBB.setFromObject(this.robot).expandByScalar(-0.2);
                // decrease BoxMan attack and Robot health
                if (boxmanAttack > 0) {
                  setRobotHealth(prev => { const nh = prev - 1; if (nh <= 0) this.robot.visible = false; return nh; });
                }
              }
            }
            setTimeout(() => {
              if (action) action.stop();
              this.boxMan.userData.isDoorPlaying = false;
              const idleName = this.boxMan.userData.idleName;
              if (idleName) {
                this.boxMan.animation.play(idleName);
                this.boxMan.userData.currentAnim = idleName;
              }
            }, doorDuration * 1000);
          }
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.WEBGL,
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

    if (typeof window !== "undefined" && started) {
      loadPhaserAndEnable3D();
    }

    return () => {
      if (game && game.destroy) game.destroy(true);
    };
  }, [started]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = React.useState("");
  const [activeTab, setActiveTab] = useState<'chat' | 'list' | 'leaderboard' | 'movement' | 'position'>("chat");
  const [playerName, setPlayerName] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [bottomHeight, setBottomHeight] = useState<number>(300);
  const isResizing = useRef<boolean>(false);

  const [messagesRobot, setMessagesRobot] = useState<Message[]>([]);
  const [chatRobotInput, setChatRobotInput] = useState<string>("");
  const chatRobotContainerRef = useRef<HTMLDivElement>(null);

  const maxBoxmanHealth = 1;
  const maxBoxmanAttack = 1;
  const [boxmanHealth, setBoxmanHealth] = useState<number>(maxBoxmanHealth);
  const [boxmanAttack, setBoxmanAttack] = useState<number>(maxBoxmanAttack);
  const maxRobotHealth = 1;
  const maxRobotAttack = 1;
  const [robotHealth, setRobotHealth] = useState<number>(maxRobotHealth);
  const [robotAttack, setRobotAttack] = useState<number>(maxRobotAttack);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const input = chatInput.trim();
    if (!input) return;
    // add user message
    setMessages(prev => [...prev, { sender: 'user', text: input }]);
    setChatInput("");
    // call chat API
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: input }] }),
      });
      const { content, tool_calls } = await res.json();
      // assistant reply (only if content)
      if (content) setMessages(prev => [...prev, { sender: 'ai', text: content }]);
      // function calls (parse name & args)
      tool_calls?.forEach((call: any) => {
        const fn = call.function;
        let args;
        try {
          args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;
        } catch {
          args = {};
        }
        setMessages(prev => [...prev, { sender: 'ai_tool', functionName: fn.name, toolArgs: args }]);
        if (fn.name === 'move' && args.direction) {
          let dx = 0, dz = 0;
          if (args.direction === 'left') dx = -robotSpeed;
          else if (args.direction === 'right') dx = robotSpeed;
          else if (args.direction === 'up') dz = -robotSpeed;
          else if (args.direction === 'down') dz = robotSpeed;
          moveBoxman(dx, dz);
        } else if (fn.name === 'punch') {
          punchBoxman();
        }
      });
    } catch (err) {
      console.error('Chat error', err);
    }
  }

  async function handleSendRobot(e: React.FormEvent) {
    e.preventDefault();
    const input = chatRobotInput.trim();
    if (!input) return;
    setMessagesRobot(prev => [...prev, { sender: 'user', text: input }]);
    setChatRobotInput("");
    try {
      const res = await fetch('/api/chat-robot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: input }] }),
      });
      const { content, tool_calls } = await res.json();
      if (content) setMessagesRobot(prev => [...prev, { sender: 'ai', text: content }]);
      tool_calls?.forEach((call: any) => {
        const fn = call.function;
        let args;
        try { args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments; } catch { args = {}; }
        setMessagesRobot(prev => [...prev, { sender: 'ai_tool', functionName: fn.name, toolArgs: args }]);
        if (fn.name === 'move' && args.direction) {
          let dx = 0, dz = 0;
          if (args.direction === 'left') dx = -robotSpeed;
          else if (args.direction === 'right') dx = robotSpeed;
          else if (args.direction === 'up') dz = -robotSpeed;
          else if (args.direction === 'down') dz = robotSpeed;
          moveRobot(dx, dz);
        } else if (fn.name === 'punch') {
          punchRobot();
        }
      });
    } catch (err) {
      console.error('Robot chat error', err);
    }
  }

  const respawnBoxMan = () => {
    const scene = gameRef.current?.scene.getScene("MainScene");
    if (scene?.boxMan) {
      const boundary = 10;
      const x = Math.random() * 2 * boundary - boundary;
      const z = Math.random() * 2 * boundary - boundary;
      scene.boxMan.position.set(x, 0, z);
      scene.boxMan.visible = true;
    }
    setBoxmanHealth(maxBoxmanHealth);
    setBoxmanAttack(maxBoxmanAttack);
  };

  const respawnRobot = () => {
    const scene = gameRef.current?.scene.getScene("MainScene");
    if (scene?.robot) {
      const boundary = 10;
      const x = Math.random() * 2 * boundary - boundary;
      const z = Math.random() * 2 * boundary - boundary;
      scene.robot.position.set(x, 0, z);
      scene.robot.visible = true;
      scene.robotBB.setFromObject(scene.robot).expandByScalar(-0.2);
    }
    setRobotHealth(maxRobotHealth);
    setRobotAttack(maxRobotAttack);
  };

  const handleStart = () => {
    if (!playerName.trim()) return;
    const id = Math.random().toString(36).substring(2, 8);
    setSessionId(id);
    console.log(`Starting game for ${playerName}`);
    setStarted(true);
    setBottomHeight(300);
  }

  const handleLogout = () => {
    setStarted(false);
    setPlayerName("");
    setSessionId("");
    setActiveTab('chat');
    setMessages([]);
    setMessagesRobot([]);
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (chatRobotContainerRef.current) {
      chatRobotContainerRef.current.scrollTo({ top: chatRobotContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messagesRobot]);

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
      <div style={{ flex: 1, position: "relative" }}>
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: `calc(100vh - ${bottomHeight}px)`,
          }}
        />
      </div>
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
                   Enemies logs
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
                  <button
                    className={`btn mx-1 ${activeTab === 'position' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('position')}
                  >
                    Position
                  </button>
                </div>
                <span className="ml-auto mr-2 font-bold">{`${playerName}-${sessionId}`}</span>
                <button className="btn btn-outline btn-error" onClick={handleLogout}>
                  Logout
                </button>
              </div>
              {activeTab === 'chat' ? (
                <>
                
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <label style={{ fontWeight: 600 }}>Health {boxmanHealth}/{maxBoxmanHealth}</label>
                        <button className="btn btn-xs btn-outline">Upgrade</button>
                      </div>
                      <progress className="progress w-full progress-success" value={boxmanHealth} max={maxBoxmanHealth} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <label style={{ fontWeight: 600 }}>Attack {boxmanAttack}/{maxBoxmanAttack}</label>
                        <button className="btn btn-xs btn-outline">Upgrade</button>
                      </div>
                      <progress className="progress w-full progress-error" value={boxmanAttack} max={maxBoxmanAttack} />
                    </div>
                  </div>
                  <div ref={chatContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {messages.map((msg, idx) => {
                      // skip empty AI content
                      if (msg.sender === 'ai' && !msg.text) return null;
                      if (msg.sender === 'ai_tool') {
                        return (
                          <div
                            key={idx}
                            style={{
                              alignSelf: 'flex-start',
                              background: '#e0f7fa',
                              color: '#006064',
                              borderRadius: '16px',
                              padding: '12px 18px',
                              maxWidth: '85%',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              marginTop: idx === 0 ? 8 : 0,
                            }}
                          >
                            <b>Function Call:</b> {msg.functionName}
                            <br />
                            <code>{JSON.stringify(msg.toolArgs)}</code>
                          </div>
                        );
                      }
                      return (
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
                          {msg.sender === 'user' ? <b>{playerName}:</b> : <b>AI Assistant:</b>} {msg.text}
                        </div>
                      );
                    })}
                  </div>
                  {boxmanHealth > 0 ? (
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
                  ) : (
                    <button className="btn btn-primary mt-2" onClick={respawnBoxMan}>
                      Respawn
                    </button>
                  )}
                </>
              ) : activeTab === 'list' ? (
                <>
                
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <label style={{ fontWeight: 600, marginBottom: 4 }}>Robot Health {robotHealth}/{maxRobotHealth}</label>
                      <progress className="progress w-full progress-success" value={robotHealth} max={maxRobotHealth} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <label style={{ fontWeight: 600, marginBottom: 4 }}>Robot Attack {robotAttack}/{maxRobotAttack}</label>
                      <progress className="progress w-full progress-error" value={robotAttack} max={maxRobotAttack} />
                    </div>
                  </div>
                  <div ref={chatRobotContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    {messagesRobot.map((msg, idx) => {
                      if (msg.sender === 'ai' && !msg.text) return null;
                      if (msg.sender === 'ai_tool') {
                        return (
                          <div key={idx} style={{ alignSelf: 'flex-start', background: '#e0f7fa', color: '#006064', borderRadius: '16px', padding: '12px 18px', maxWidth: '85%', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginTop: idx === 0 ? 8 : 0 }}>
                            <b>Function Call:</b> {msg.functionName}<br />
                            <code>{JSON.stringify(msg.toolArgs)}</code>
                          </div>
                        );
                      }
                      return (
                        <div key={idx} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', background: msg.sender === 'user' ? '#222' : '#f1f1f1', color: msg.sender === 'user' ? '#fff' : '#222', borderRadius: '16px', padding: '12px 18px', maxWidth: '85%', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', marginTop: idx === 0 ? 8 : 0 }}>
                          {msg.sender === 'user' ? <b>{playerName}:</b> : <b>AI Assistant:</b>} {msg.text}
                        </div>
                      );
                    })}
                  </div>
                  {robotHealth > 0 ? (
                    <form
                      style={{
                        borderTop: '1px solid #eee',
                        paddingTop: 16,
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        background: '#fff',
                      }}
                      onSubmit={handleSendRobot}
                    >
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={chatRobotInput}
                        onChange={(e) => setChatRobotInput(e.target.value)}
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
                  ) : (
                    <button className="btn btn-primary mt-2" onClick={respawnRobot}>
                      Respawn Robot
                    </button>
                  )}
                </>
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
                  <button className="btn" onClick={() => punchRobot()}>Punch</button>
                </div>
              ) : activeTab === 'position' ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: 16 }}>
                  <div>Ground bounds: 20 × 20 units</div>
                  {(() => {
                    const scene = gameRef.current?.scene.getScene("MainScene");
                    if (scene && scene.boxMan && scene.robot) {
                      return (
                        <>
                          <div>BoxMan: x: {scene.boxMan.position.x.toFixed(2)}, y: {scene.boxMan.position.y.toFixed(2)}, z: {scene.boxMan.position.z.toFixed(2)}</div>
                          <div>Robot: x: {scene.robot.position.x.toFixed(2)}, y: {scene.robot.position.y.toFixed(2)}, z: {scene.robot.position.z.toFixed(2)}</div>
                          {/* Markdown grid (21×21) */}
                          <pre style={{ fontFamily: 'monospace', fontSize: '0.6em', marginTop: 8 }}>
                            {(() => {
                              const size = 21;
                              const half = 10;
                              const grid = Array.from({ length: size }, () => Array(size).fill('.'));
                              const bx = Math.round(scene.boxMan.position.x) + half;
                              const bz = Math.round(scene.boxMan.position.z) + half;
                              const rx = Math.round(scene.robot.position.x) + half;
                              const rz = Math.round(scene.robot.position.z) + half;
                              if (bz >= 0 && bz < size && bx >= 0 && bx < size) grid[bz][bx] = 'B';
                              if (rz >= 0 && rz < size && rx >= 0 && rx < size) grid[rz][rx] = 'R';
                              return grid.map(row => '| ' + row.join(' | ') + ' |').join('\n');
                            })()}
                          </pre>
                        </>
                      );
                    }
                    return <div>Loading scene...</div>;
                  })()}
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
