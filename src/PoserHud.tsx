import {
  GroupProps,
  Object3DProps,
  PrimitiveProps,
  Props,
  ReactThreeFiber,
  ThreeEvent,
} from "@react-three/fiber";
import { useEffect, useState } from "react";
import { PoseAnimation } from "./Poser";
import { Box, RoundedBox, Text } from "@react-three/drei";
import { allBones } from "./allBones";
import { Vector3 } from "three";
import { chartruse, eigengrau, eigenlumin, eigenmid } from "./colors";
import { EventHandlers } from "@react-three/fiber/dist/declarations/src/core/events";
import { Interactive } from "@react-three/xr";

const hasAddedBone = localStorage.getItem("hasAddedBone") === "true";

export type PoserHudProps = {
  width: number;
  height: number;
  onTimeChange: (time: number) => void;
  onAnimationChange: (animation: PoseAnimation) => void;
  onInteractingChanged: (interacting: boolean) => void;
} & GroupProps;

const PADDING = 10;

const Typography = ({
  children,
  size,
  align,
  ...props
}: {
  children: React.ReactNode;
  size?: 1 | 1.5 | 3;
  align?: "left" | "center" | "right";
  position?: ReactThreeFiber.Vector3;
} & EventHandlers) => {
  return (
    <Text
      {...props}
      color={eigenlumin}
      fontSize={size || 1}
      scale={[10, 10, 10]}
      anchorX={align || "center"}
      anchorY="middle"
    >
      {children}
    </Text>
  );
};

const NumericSliderInput = ({
  name,
  value,
  width,
  min,
  max,
  onChange,
  ...groupProps
}: {
  name: string;
  value: number;
  width: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
} & GroupProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [didMove, setDidMove] = useState(false);

  const handleMouseDown = (e: ThreeEvent<PointerEvent>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartValue(value);
    setDidMove(false);
  };

  const handleMouseMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      const delta = e.clientX - dragStartX;
      const newValue = dragStartValue + (delta / width) * (max - min);
      onChange(newValue);
      setDidMove(true);
    }
  };

  const handleMouseUp = (e: ThreeEvent<PointerEvent>) => {
    setIsDragging(false);
    if (!didMove) {
      onChange(value);
    }
  };

  return (
    <group {...groupProps}>
      <mesh
        position={[width / 2, 0, -0.01]}
        onPointerMove={handleMouseMove}
        onPointerUp={handleMouseUp}
      >
        <planeGeometry args={[width, 12]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[width / 2, 0, -0.01]}>
        <planeGeometry args={[width, 4]} />
        <meshBasicMaterial color={eigenmid} />
      </mesh>
      <mesh
        position={[(value / (max - min)) * width, 0, 0]}
        onPointerDown={handleMouseDown}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <circleGeometry args={[5, 7]} />
        <meshBasicMaterial color={eigenlumin} />
      </mesh>
    </group>
  );
};

const VectorInput = ({
  name,
  value,
  width,
  min,
  max,
  onChange,
  ...groupProps
}: {
  name: string;
  value: [number, number, number];
  width: number;
  min: number;
  max: number;
  onChange: (value: [number, number, number]) => void;
} & GroupProps) => {
  return (
    <group {...groupProps}>
      <Typography position={[10, 0, 0]} size={1} align="left">
        {name}
      </Typography>
      <NumericSliderInput
        name="x"
        value={value[0]}
        width={(width * 2) / 3}
        min={min}
        max={max}
        onChange={(_) => onChange([_, value[1], value[2]])}
        position={[(width * 1) / 3, -14, 0]}
      />
      <NumericSliderInput
        name="y"
        value={value[1]}
        width={(width * 2) / 3}
        min={min}
        max={max}
        onChange={(_) => onChange([value[0], _, value[2]])}
        position={[(width * 1) / 3, 0, 0]}
      />
      <NumericSliderInput
        name="z"
        value={value[2]}
        width={(width * 2) / 3}
        min={min}
        max={max}
        onChange={(_) => onChange([value[0], value[1], _])}
        position={[(width * 1) / 3, 14, 0]}
      />
    </group>
  );
};

const Button = ({
  text,
  width,
  onClick,
  position,
  ...groupProps
}: {
  text: string;
  width: number;
  onClick: () => void;
  position: [number, number, number];
} & GroupProps) => {
  let [hovered, setHovered] = useState(false);
  return (
    <Interactive
      onSelectEnd={onClick}
      onHover={() => {
        setHovered(true);
      }}
      onBlur={() => {
        setHovered(false);
      }}
    >
      <group
        {...groupProps}
        position={
          hovered
            ? [position[0], position[1], position[2] + 5]
            : [position[0], position[1], position[2]]
        }
        onClick={onClick}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <Box args={[width, 23, 0]}>
          <meshBasicMaterial color={hovered ? "#444" : "#333"} />
        </Box>
        <Typography position={[0, 0, 1]}>{text}</Typography>
      </group>
    </Interactive>
  );
};

const Timeline = ({
  width,
  currentTime,
  animation,
  onTimeChange,
  currentSelectedKeyFrame,
  onSelectKeyFrame,
  onInteractingChanged,
  ...groupProps
}: {
  width: number;
  currentTime: number;
  animation: PoseAnimation;
  currentSelectedKeyFrame: number | undefined;
  onSelectKeyFrame: (index: number) => void;
  onTimeChange: (time: number) => void;
  onInteractingChanged?: (interacting: boolean) => void;
} & GroupProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartCurrentTime, setDragStartCurrentTime] = useState(0);

  const handleMouseDown = (e: ThreeEvent<PointerEvent>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartCurrentTime(currentTime);
    onInteractingChanged?.(true);
    e.stopPropagation();
  };

  const handleMouseMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      const delta = e.clientX - dragStartX;
      const newTime = dragStartCurrentTime + (delta / width) * animation.length;
      onTimeChange(Math.max(0, Math.min(animation.length, newTime)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <group
      {...groupProps}
      onPointerDown={handleMouseDown}
      onPointerMove={handleMouseMove}
      onPointerUp={handleMouseUp}
    >
      <mesh position={[0, 0, 0]} scale={[width, 30, 1]}>
        <planeGeometry />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0, 0]} scale={[width, 10, 0]}>
        <planeGeometry />
        <meshBasicMaterial color={eigenmid} />
      </mesh>
      <mesh
        position={[
          (currentTime / animation.length) * width - width / 2,
          0,
          0.011,
        ]}
        scale={[5, 5, 0]}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <circleGeometry />
        <meshBasicMaterial color={chartruse} />
      </mesh>
      {animation.length > 0 &&
        animation.keyframes.map(({ time }, i) => {
          return (
            <mesh
              key={i}
              position={[
                (time / animation.length) * width - width / 2,
                0,
                0.01,
              ]}
              scale={[10, 10, 0]}
              onPointerDown={(_) => {
                onSelectKeyFrame(i);
                <meshBasicMaterial color={eigenmid} />;
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <circleGeometry />
              <meshBasicMaterial
                color={currentSelectedKeyFrame === i ? eigenlumin : eigenmid}
              />
            </mesh>
          );
        })}
    </group>
  );
};

export function PoserHud({
  width,
  height,
  onAnimationChange,
  onInteractingChanged,
  ...groupProps
}: PoserHudProps) {
  const [helperMessage, setHelperMessage] = useState<string>("");
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSelectedKeyFrame, setCurrentSelectedKeyFrame] = useState<
    number | null
  >(0);
  const [showBoneNames, setShowBoneNames] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [animation, setAnimation] = useState<PoseAnimation>({
    length: 15,
    keyframes: [
      {
        time: 0,
        pose: {},
      },
    ],
  });
  const [playIntervalHandle, setPlayIntervalHandle] = useState<number | null>(
    null
  );

  useEffect(() => {
    onAnimationChange(animation);
  }, [animation]);

  useEffect(() => {
    if (isPlaying) {
      const handle = setInterval(() => {
        setCurrentTime((currentTime) => {
          const newTime = currentTime + 0.1;
          if (newTime > animation.length) {
            return 0;
          }
          return newTime;
        });
      }, 100);
      setPlayIntervalHandle(handle);
    } else {
      if (playIntervalHandle) {
        clearInterval(playIntervalHandle);
        setPlayIntervalHandle(null);
      }
    }
  }, [isPlaying]);

  const currentKeyFrame =
    currentSelectedKeyFrame !== null
      ? animation.keyframes[currentSelectedKeyFrame]
      : undefined;

  if (minimized) {
    return (
      <group {...groupProps}>
        <RoundedBox
          args={[width / 30, width / 30]}
          radius={width / 120}
          position={[
            width / 2 - width / 30 / 2,
            -height / 2 + width / 30 / 2,
            -1,
          ]}
          onPointerUp={() => setMinimized(false)}
        >
          <meshPhongMaterial color="#e9e9e2" transparent opacity={0.3} />
        </RoundedBox>
      </group>
    );
  }

  if (showBoneNames) {
    const allKnownBoneNames = [...allBones.sort()];
    const currentBoneNames = currentKeyFrame
      ? Object.keys(currentKeyFrame.pose)
      : [];
    const remainingBones = allKnownBoneNames.filter(
      (boneName) => !currentBoneNames.includes(boneName)
    );

    return (
      <group {...groupProps}>
        <mesh position={[0, 0, -1]}>
          <boxGeometry args={[width, height]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
        {remainingBones.map((boneName, i) => {
          const colsPerRow = 7;
          const row = Math.floor(i / colsPerRow);
          const col = i % colsPerRow;
          return (
            <Button
              key={boneName}
              position={[
                -width / 2 +
                  (width / colsPerRow) * col +
                  width / colsPerRow / 2,
                height / 2 - 10 - row * 20,
                0,
              ]}
              text={boneName}
              width={width / colsPerRow}
              onClick={() => {
                localStorage.setItem("hasAddedBone", "true");
                setAnimation((animation) => {
                  const newAnimation = {
                    ...animation,
                    keyframes: animation.keyframes.map((keyframe, i) => {
                      if (i !== currentSelectedKeyFrame) return keyframe;
                      return {
                        ...keyframe,
                        pose: {
                          ...keyframe.pose,
                          [boneName]: ["MouthSmile", "MouthOpen"].includes(
                            boneName
                          )
                            ? 0
                            : {
                                x: 0,
                                y: 0,
                                z: 0,
                              },
                        },
                      };
                    }),
                  };
                  return newAnimation;
                });
                setShowBoneNames(false);
                setHelperMessage(
                  `You added ${boneName}! You can now adjust the sliders of it's x y z values.`
                );
              }}
            />
          );
        })}
      </group>
    );
  }

  return (
    <group {...groupProps}>
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[width, height]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
      <Typography
        align="left"
        size={1.5}
        position={[-width / 2 + PADDING, height / 2 - PADDING, 0]}
      >
        Time: {currentTime.toFixed(2)}/{animation.length.toFixed(2)} seconds{" "}
        {helperMessage.length > 0 ? `- ${helperMessage}` : ""}
      </Typography>
      <Button
        text={isPlaying ? "Pause" : "Play"}
        width={100}
        position={[width / 2 + PADDING - 180, height / 2 - 2 * PADDING, 0]}
        onClick={() => {
          isPlaying ? setIsPlaying(false) : setIsPlaying(true);
        }}
      />
      <Button
        text="time = 0"
        width={100}
        position={[width / 2 + PADDING - 70, height / 2 - 2 * PADDING, 0]}
        onClick={() => {
          setCurrentTime(0);
        }}
      />
      <Button
        width={100}
        text="Download Animation"
        position={[width / 2 + PADDING - 70, -height / 2 + PADDING + 45, 0]}
        onClick={() => {
          const element = document.createElement("a");
          const file = new Blob([JSON.stringify(animation)], {
            type: "text/plain",
          });
          element.href = URL.createObjectURL(file);
          element.download = "animation.json";
          document.body.appendChild(element); // Required for this to work in FireFox
          element.click();
        }}
      />

      <Button
        width={100}
        text="About/Help"
        position={[width / 2 + PADDING - 180, -height / 2 + PADDING + 10, 0]}
        onClick={() => {
          let w = window.open("_blank");
          if (w) w.location = "https://github.com/richardanaya/avatar-poser/";
        }}
      />

      <Button
        width={100}
        text="Minimize"
        position={[width / 2 + PADDING - 70, -height / 2 + PADDING + 10, 0]}
        onClick={() => {
          setMinimized(true);
        }}
      />

      <Button
        width={100}
        text="Add Keyframe"
        position={[width / 2 + PADDING - 180, -height / 2 + PADDING + 80, 0]}
        onClick={() => {
          setAnimation({
            ...animation,
            keyframes: [
              ...animation.keyframes,
              {
                time: currentTime,
                pose: {},
              },
            ],
          });
          setCurrentSelectedKeyFrame(animation.keyframes.length);
        }}
      />

      {currentKeyFrame && (
        <>
          <Button
            width={100}
            text="Add Bone"
            position={[
              width / 2 + PADDING - 180,
              -height / 2 + PADDING + 115,
              0,
            ]}
            onClick={() => {
              setShowBoneNames(true);
            }}
          />
          <Button
            width={100}
            text="Delete Bone"
            position={[
              width / 2 + PADDING - 70,
              -height / 2 + PADDING + 115,
              0,
            ]}
            onClick={() => {}}
          />
          <Button
            width={100}
            text="Delete Keyframe"
            position={[width / 2 + PADDING - 70, -height / 2 + PADDING + 80, 0]}
            onClick={() => {
              setAnimation({
                ...animation,
                keyframes: animation.keyframes.filter(
                  (_, i) => i !== currentSelectedKeyFrame
                ),
              });
              setCurrentSelectedKeyFrame(null);
            }}
          />
          {Object.keys(currentKeyFrame.pose).length === 0 ? (
            <>
              <Typography position={[0, 0, 0]} size={1.5}>
                No bones are currently being animated in this keyframe.
              </Typography>
              {!hasAddedBone && (
                <Typography position={[0, -20, 0]} size={1.5}>
                  Add a bone using the menu on the right ( "neck" is suggested
                  to see how this works ).
                </Typography>
              )}
            </>
          ) : (
            Object.entries(currentKeyFrame.pose).map(([boneName, bone], i) => {
              const widthOfManipulators = (width * 4) / 5;
              const colsPerRow = 3;
              const row = Math.floor(i / colsPerRow);
              const col = i % colsPerRow;
              const isRotation = true;
              !["MouthSmile", "MouthOpen"].includes(boneName);
              const position = new Vector3(
                -width / 2 + (widthOfManipulators / colsPerRow) * col + 30,
                height / 2 - 20 - row * 50 - 60,
                0
              );
              return isRotation ? (
                <VectorInput
                  key={boneName}
                  name={boneName}
                  position={position}
                  width={widthOfManipulators / colsPerRow}
                  value={[bone.x, bone.y, bone.z]}
                  min={-Math.PI}
                  max={Math.PI}
                  onChange={(_) => {
                    setAnimation((animation) => {
                      const newAnimation = {
                        ...animation,
                        keyframes: animation.keyframes.map((keyframe, i) => {
                          if (i !== currentSelectedKeyFrame) return keyframe;
                          return {
                            ...keyframe,
                            pose: {
                              ...keyframe.pose,
                              [boneName]: {
                                x: _[0],
                                y: _[1],
                                z: _[2],
                              },
                            },
                          };
                        }),
                      };
                      return newAnimation;
                    });
                    setHelperMessage(
                      `Bone ${boneName} set to x:${_[0].toFixed(
                        4
                      )} y:${_[1].toFixed(4)} z:${_[2].toFixed(4)}`
                    );
                  }}
                />
              ) : (
                <NumericSliderInput
                  key={boneName}
                  name={boneName}
                  position={position}
                  width={widthOfManipulators / colsPerRow}
                  value={bone as number}
                  min={0}
                  max={1}
                  onChange={(_) => {
                    setAnimation((animation) => {
                      const newAnimation = {
                        ...animation,
                        keyframes: animation.keyframes.map((keyframe, i) => {
                          if (i !== currentSelectedKeyFrame) return keyframe;
                          return {
                            ...keyframe,
                            pose: {
                              ...keyframe.pose,
                              [boneName]: _,
                            },
                          };
                        }),
                      };
                      return newAnimation;
                    });
                    setHelperMessage(`Bone ${boneName} set to ${_.toFixed(4)}`);
                  }}
                />
              );
            })
          )}
        </>
      )}
      {!currentKeyFrame && (
        <Typography position={[0, 0, 0]}>
          {(animation.keyframes.length === 0
            ? "No keyframes in this animation."
            : "Select a keyframe to edit it."
          ).toUpperCase()}
        </Typography>
      )}
      <Timeline
        onInteractingChanged={onInteractingChanged}
        position={[0, height / 2 - PADDING - 40, 0]}
        width={width * 0.9}
        currentSelectedKeyFrame={currentSelectedKeyFrame ?? undefined}
        onSelectKeyFrame={(_) => {
          setCurrentSelectedKeyFrame(_);
        }}
        currentTime={currentTime}
        animation={animation}
        onTimeChange={(_) => {
          setCurrentTime(_);
        }}
      />
    </group>
  );
}
