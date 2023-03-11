import { GroupProps, ReactThreeFiber, ThreeEvent } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { PoseAnimation, usePoserStore } from "./Poser";
import { Box, Plane, RoundedBox, Text } from "@react-three/drei";
import { allBones, bonesByCategory } from "./allBones";
import { Mesh, Shape, Vector3 } from "three";
import { chartruse, eigenlumin, eigenmid } from "./colors";
import { EventHandlers } from "@react-three/fiber/dist/declarations/src/core/events";
import { Interactive, useXR, XRInteractionHandler } from "@react-three/xr";

const hasAddedBone = localStorage.getItem("hasAddedBone") === "true";

const queryParams = new URLSearchParams(window.location.search);
const autoplay = queryParams.get("autoplay") === "true";

export type PoserHudProps = {
  width: number;
  height: number;
  url: string;
} & GroupProps;

const PADDING = 10;

const Typography = ({
  children,
  size,
  align,
  color,
  ...props
}: {
  children: React.ReactNode;
  size?: 1 | 1.5 | 3;
  align?: "left" | "center" | "right";
  color?: string;
  position?: ReactThreeFiber.Vector3;
} & EventHandlers) => {
  return (
    <Text
      {...props}
      color={color || eigenlumin}
      fontSize={size || 1}
      scale={[10, 10, 0.0001]}
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
  large,
  onChange,
  ...groupProps
}: {
  name: string;
  value: number;
  large: boolean;
  width: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
} & GroupProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState(0);

  const handleMouseDown = (e: ThreeEvent<PointerEvent>) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartValue(value);
  };

  const handleMouseMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      const delta = e.clientX - dragStartX;
      const newValue = dragStartValue + (delta / width) * (max - min);
      onChange(Math.min(Math.max(min, newValue), max));
    }
  };

  const handleMouseUp = (e: ThreeEvent<PointerEvent>) => {
    setIsDragging(false);
  };

  const [hovered, setHovered] = useState(false);

  return (
    <group {...groupProps}>
      <mesh
        position={[0, 0, -0.01]}
        onPointerMove={isDragging ? handleMouseMove : undefined}
        onPointerUp={isDragging ? handleMouseUp : undefined}
      >
        <planeGeometry
          args={[isDragging ? 10000 : 0, isDragging ? 10000 : 0]}
        />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width, 4]} />
        <meshBasicMaterial color={eigenmid} />
      </mesh>
      <Typography
        position={[-width / 2 - PADDING, 0, 0]}
        align="right"
        color={eigenmid}
      >
        {name}
      </Typography>
      <Interactive
        onHover={() => {
          setHovered(true);
        }}
        onBlur={() => {
          setHovered(false);
        }}
      >
        <mesh
          position={[(value / (max - min)) * width, 0, 0]}
          onPointerDown={isDragging ? undefined : handleMouseDown}
          onPointerOver={
            isDragging
              ? undefined
              : () => {
                  document.body.style.cursor = "pointer";
                }
          }
          onPointerOut={
            isDragging
              ? undefined
              : () => {
                  document.body.style.cursor = "auto";
                }
          }
        >
          <circleGeometry args={large ? [15, 15] : [7, 7]} />
          <meshBasicMaterial color={hovered ? "red" : eigenlumin} />
        </mesh>
      </Interactive>
    </group>
  );
};

const Vector3Input = ({
  name,
  value,
  width,
  min,
  max,
  large,
  onChange,
  ...groupProps
}: {
  name: string;
  value: [number, number, number];
  width: number;
  large: boolean;
  min: number;
  max: number;
  onChange: (value: [number, number, number]) => void;
} & GroupProps) => {
  const ratio = 0.9;
  return (
    <group {...groupProps}>
      <Typography
        position={[(width * (1 - ratio)) / 2, 16, 0]}
        size={large ? 1.5 : 1}
        align="left"
      >
        {name}
      </Typography>
      <NumericSliderInput
        name="x"
        value={value[0]}
        width={width * ratio}
        min={min}
        max={max}
        large={large}
        onChange={(_) => onChange([_, value[1], value[2]])}
        position={[width / 2, 0, 0]}
      />
      <NumericSliderInput
        name="y"
        value={value[1]}
        width={width * ratio}
        min={min}
        max={max}
        large={large}
        onChange={(_) => onChange([value[0], _, value[2]])}
        position={[width / 2, large ? -30 : -14, 0]}
      />
      <NumericSliderInput
        name="z"
        value={value[2]}
        width={width * ratio}
        min={min}
        max={max}
        large={large}
        onChange={(_) => onChange([value[0], value[1], _])}
        position={[width / 2, large ? -60 : -28, 0]}
      />
    </group>
  );
};

const Vector1Input = ({
  name,
  value,
  width,
  min,
  max,
  large,
  onChange,
  ...groupProps
}: {
  name: string;
  value: [number, number, number];
  width: number;
  large: boolean;
  min: number;
  max: number;
  onChange: (value: [number, number, number]) => void;
} & GroupProps) => {
  return (
    <group {...groupProps}>
      <Typography
        position={[(width * (1 - 0.9)) / 2, 16, 0]}
        size={large ? 1.5 : 1}
        align="left"
      >
        {name}
      </Typography>
      <NumericSliderInput
        name=""
        value={value[0]}
        width={width * 0.9}
        min={min}
        max={max}
        large={large}
        onChange={(_) => onChange([_, value[1], value[2]])}
        position={[width / 2, 0, 0]}
      />
    </group>
  );
};

function RoundedRectOutline({
  width,
  height,
  radius,
  lineWidth,
  color,
}: {
  width: number;
  height: number;
  radius: number;
  lineWidth: number;
  color?: string;
}) {
  const shape = new Shape();
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const quarterRadius = radius;

  shape.moveTo(-halfWidth + quarterRadius, -halfHeight);
  shape.lineTo(halfWidth - quarterRadius, -halfHeight);
  shape.quadraticCurveTo(
    halfWidth,
    -halfHeight,
    halfWidth,
    -halfHeight + quarterRadius
  );
  shape.lineTo(halfWidth, halfHeight - quarterRadius);
  shape.quadraticCurveTo(
    halfWidth,
    halfHeight,
    halfWidth - quarterRadius,
    halfHeight
  );
  shape.lineTo(-halfWidth + quarterRadius, halfHeight);
  shape.quadraticCurveTo(
    -halfWidth,
    halfHeight,
    -halfWidth,
    halfHeight - quarterRadius
  );
  shape.lineTo(-halfWidth, -halfHeight + quarterRadius);
  shape.quadraticCurveTo(
    -halfWidth,
    -halfHeight,
    -halfWidth + quarterRadius,
    -halfHeight
  );

  // make it hollow based on radius and line width
  shape.holes.push(
    new Shape()
      .moveTo(-halfWidth + radius, -halfHeight + lineWidth)
      .lineTo(halfWidth - radius, -halfHeight + lineWidth)
      .quadraticCurveTo(
        halfWidth - lineWidth,
        -halfHeight + lineWidth,
        halfWidth - lineWidth,
        -halfHeight + radius
      ) // top right
      .lineTo(halfWidth - lineWidth, halfHeight - radius)
      .quadraticCurveTo(
        halfWidth - lineWidth,
        halfHeight - lineWidth,
        halfWidth - radius,
        halfHeight - lineWidth
      ) // bottom right
      .lineTo(-halfWidth + radius, halfHeight - lineWidth)
      .quadraticCurveTo(
        -halfWidth + lineWidth,
        halfHeight - lineWidth,
        -halfWidth + lineWidth,
        halfHeight - radius
      ) // bottom left
      .lineTo(-halfWidth + lineWidth, -halfHeight + radius)
      .quadraticCurveTo(
        -halfWidth + lineWidth,
        -halfHeight + lineWidth,
        -halfWidth + radius,
        -halfHeight + lineWidth
      ) // top left
  );

  return (
    <mesh>
      <shapeGeometry args={[shape]} />
      <lineBasicMaterial color={color || eigenlumin} linewidth={lineWidth} />
    </mesh>
  );
}

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
      onSelectEnd={() => {
        onClick();
      }}
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
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
          setHovered(false);
        }}
      >
        <RoundedRectOutline
          color={hovered ? eigenlumin : eigenmid}
          width={width}
          height={23}
          radius={4}
          lineWidth={1}
        ></RoundedRectOutline>
        <Box args={[width, 23, 0]}>
          <meshBasicMaterial transparent opacity={0} />
        </Box>
        <Typography
          position={[0, 0, 1]}
          color={hovered ? eigenlumin : eigenmid}
        >
          {text}
        </Typography>
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
  setMessage,
  ...groupProps
}: {
  width: number;
  currentTime: number;
  animation: PoseAnimation;
  currentSelectedKeyFrame: number | undefined;
  onSelectKeyFrame: (index: number) => void;
  setMessage: (message: string) => void;
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

  let sliderRef = useRef<Mesh>(null);

  const [hovered, setHovered] = useState(false);

  return (
    <group {...groupProps}>
      <Interactive
        onHover={() => {
          setHovered(true);
        }}
        onBlur={() => {
          setHovered(false);
        }}
        onSelectStart={(e) => {
          setIsDragging(true);
          setDragStartX(e.intersection?.point.x || 0);
          setMessage(JSON.stringify(e.intersection?.point));
        }}
        onMove={(e) => {
          console.log(e.intersection?.object.name);
          const offsetX =
            (e.intersection?.point.x || 0 - dragStartX) - (width * 0.001) / 2;
          onTimeChange(
            Math.max(
              0,
              Math.min(animation.length, (1 - -offsetX) * animation.length)
            )
          );
        }}
        onSelectEnd={() => {
          setIsDragging(false);
        }}
      >
        <mesh
          name="blah"
          position={[0, 0, 0]}
          onPointerMove={handleMouseMove}
          onPointerUp={handleMouseUp}
        >
          <planeGeometry
            args={[isDragging ? 10000 : width, isDragging ? 10000 : 20]}
          />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </Interactive>
      <mesh position={[0, 0, 0]} ref={sliderRef}>
        <planeGeometry args={[width, 10]} />
        <meshBasicMaterial color={eigenmid} />
      </mesh>
      <Interactive>
        <mesh
          name="circle"
          onPointerDown={handleMouseDown}
          position={[
            (currentTime / animation.length) * width - width / 2,
            0,
            0.02,
          ]}
          onPointerOver={() => {
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "auto";
          }}
        >
          <circleGeometry args={[5, 5]} />
          <meshBasicMaterial color={hovered ? "red" : chartruse} />
        </mesh>
      </Interactive>
      {animation.length > 0 &&
        animation.keyframes.map(({ time }, i) => {
          return (
            <Interactive
              key={i}
              onSelectEnd={() => {
                onSelectKeyFrame(i);
              }}
            >
              <mesh
                position={[
                  (time / animation.length) * width - width / 2,
                  0,
                  0.01,
                ]}
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
                <circleGeometry args={[10, 10]} />
                <meshBasicMaterial
                  color={currentSelectedKeyFrame === i ? eigenlumin : eigenmid}
                />
              </mesh>
            </Interactive>
          );
        })}
    </group>
  );
};

export function PoserHud({ width, height, url, ...groupProps }: PoserHudProps) {
  const {
    animation,
    setAnimation,
    currentTime,
    setCurrentTime,
    setInteracting,
  } = usePoserStore();
  const [helperMessage, setHelperMessage] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [currentSelectedKeyFrame, setCurrentSelectedKeyFrame] = useState<
    number | null
  >(0);
  const [showBoneCategories, setShowBoneCategories] = useState(false);
  const [boneCategory, setBoneCategory] = useState<string | null>(null);
  const [showBoneNames, setShowBoneNames] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [playIntervalHandle, setPlayIntervalHandle] = useState<number | null>(
    null
  );

  useEffect(() => {
    setAnimation(animation);
  }, [animation]);

  useEffect(() => {
    if (isPlaying) {
      const rate = 1 / 60;
      const handle = setInterval(() => {
        setCurrentTime((s) => {
          let newTime = s.currentTime + rate;
          if (newTime > animation.length) {
            newTime = 0;
          }
          return { currentTime: newTime };
        });
      }, 1000 * rate);
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

  const { isPresenting } = useXR();

  if (minimized) {
    return (
      <group {...groupProps}>
        <Interactive
          onSelectEnd={() => {
            setMinimized(false);
          }}
        >
          <Plane
            args={[width / 30, width / 30]}
            position={[
              width / 2 - width / 30 / 2,
              -height / 2 + width / 30 / 2,
              -1,
            ]}
            onPointerUp={() => setMinimized(false)}
          >
            <meshPhongMaterial color="#e9e9e2" transparent opacity={0.3} />
          </Plane>
        </Interactive>
      </group>
    );
  }

  if (showBoneCategories) {
    const allBoneCategories = Object.keys(bonesByCategory);
    allBoneCategories.push("Cancel");

    return (
      <group {...groupProps}>
        <mesh position={[0, 0, -1]}>
          <boxGeometry args={[width, height]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
        {allBoneCategories.map((category, i) => {
          const colsPerRow = 6;
          const row = Math.floor(i / colsPerRow);
          const col = i % colsPerRow;
          return (
            <Button
              key={category}
              position={[
                PADDING +
                  -width / 2 +
                  (width / colsPerRow - PADDING) * col +
                  width / colsPerRow / 2,
                -PADDING + height / 2 - 10 - row * (20 + PADDING),
                0,
              ]}
              text={category}
              width={width / colsPerRow - PADDING * 2}
              onClick={() => {
                if (category === "Cancel") {
                  setShowBoneCategories(false);
                  return;
                }
                setBoneCategory(category);
                setShowBoneCategories(false);
                setShowBoneNames(true);
              }}
            />
          );
        })}
      </group>
    );
  }

  if (showBoneNames) {
    const allKnownBoneNames: string[] = // @ts-ignore
      boneCategory === null ? [] : bonesByCategory[boneCategory].sort();
    const currentBoneNames = currentKeyFrame
      ? Object.keys(currentKeyFrame.pose)
      : [];
    const remainingBones = allKnownBoneNames.filter(
      (boneName) => !currentBoneNames.includes(boneName)
    );
    remainingBones.push("Cancel");

    return (
      <group {...groupProps}>
        {remainingBones.length === 1 && (
          <Typography>No more bones in this category to add</Typography>
        )}
        <mesh position={[0, 0, -1]}>
          <boxGeometry args={[width, height]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
        {remainingBones.map((boneName, i) => {
          const colsPerRow = 6;
          const row = Math.floor(i / colsPerRow);
          const col = i % colsPerRow;
          return (
            <Button
              key={boneName}
              position={[
                PADDING +
                  -width / 2 +
                  (width / colsPerRow - PADDING) * col +
                  width / colsPerRow / 2,
                -PADDING + height / 2 - 10 - row * (20 + PADDING),
                0,
              ]}
              width={width / colsPerRow - PADDING * 2}
              text={boneName}
              onClick={() => {
                if (boneName === "Cancel") {
                  setShowBoneNames(false);
                  setBoneCategory(null);
                  return;
                }
                localStorage.setItem("hasAddedBone", "true");
                setAnimation({
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
                });
                setBoneCategory(null);
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
    <group
      {...groupProps}
      onPointerDown={() => {
        setInteracting(true);
      }}
      onPointerUp={() => {
        setInteracting(false);
      }}
    >
      <mesh position={[0, 0, -1]}>
        <boxGeometry args={[width, height]} />
        <meshBasicMaterial color="black" transparent opacity={0.3} />
      </mesh>
      <Typography
        align="left"
        position={[-width / 2 + PADDING, height / 2 - 2 * PADDING, 0]}
        color={eigenmid}
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
        text="Replay"
        width={100}
        position={[width / 2 + PADDING - 70, height / 2 - 2 * PADDING, 0]}
        onClick={() => {
          setCurrentTime(() => ({
            currentTime: 0,
          }));
          setIsPlaying(true);
        }}
      />
      <Button
        width={100}
        text="Share URL Cipboard"
        position={[
          width / 2 + PADDING - 180,
          -height / 2 + PADDING + 45 + 25,
          0,
        ]}
        onClick={() => {
          const animationAsBase64 = btoa(JSON.stringify(animation));
          const shareUrl = `${window.location.origin}/?model=${url}&autoplay=true&animation=${animationAsBase64}`;
          navigator.clipboard.writeText(shareUrl);
        }}
      />
      <Button
        width={100}
        text="Download Animation"
        position={[
          width / 2 + PADDING - 70,
          -height / 2 + PADDING + 45 + 25,
          0,
        ]}
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
        position={[
          width / 2 + PADDING - 180,
          -height / 2 + PADDING + 10 + 25,
          0,
        ]}
        onClick={() => {
          let w = window.open("_blank");
          if (w) w.location = "https://github.com/richardanaya/avatar-poser/";
        }}
      />

      <Button
        width={100}
        text="Minimize"
        position={[
          width / 2 + PADDING - 70,
          -height / 2 + PADDING + 10 + 25,
          0,
        ]}
        onClick={() => {
          setMinimized(true);
        }}
      />

      <Button
        width={100}
        text={
          animation.keyframes.length == 0 ? "Add Keyframe" : "Copy Keyframe"
        }
        position={[
          width / 2 + PADDING - 180,
          -height / 2 + PADDING + 80 + 25,
          0,
        ]}
        onClick={() => {
          const newKeyFrame = JSON.parse(
            JSON.stringify(
              currentKeyFrame || {
                time: 0,
                pose: {},
              }
            )
          );
          newKeyFrame.time = currentTime;
          setAnimation({
            ...animation,
            keyframes: [...animation.keyframes, newKeyFrame],
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
              -height / 2 + PADDING + 115 + 25,
              0,
            ]}
            onClick={() => {
              setShowBoneCategories(true);
            }}
          />
          <Button
            width={100}
            text="Delete Bone"
            position={[
              width / 2 + PADDING - 70,
              -height / 2 + PADDING + 115 + 25,
              0,
            ]}
            onClick={() => {}}
          />
          <Button
            width={100}
            text="Delete Keyframe"
            position={[
              width / 2 + PADDING - 70,
              -height / 2 + PADDING + 80 + 25,
              0,
            ]}
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
                  Add a bone using the menu on the right.
                </Typography>
              )}
            </>
          ) : (
            Object.entries(currentKeyFrame.pose).map(([boneName, bone], i) => {
              const widthOfManipulators = (width * 7.7) / 10;
              const colsPerRow = isPresenting ? 1 : 3;
              const row = Math.floor(i / colsPerRow);
              const col = i % colsPerRow;
              const isRotation = !["MouthSmile", "MouthOpen"].includes(
                boneName
              );
              const position = new Vector3(
                -width / 2 + (widthOfManipulators / colsPerRow) * col + 30,
                height / 2 -
                  30 -
                  row * (isPresenting ? 120 : 70) -
                  (isPresenting ? 120 : 80),
                0
              );
              return isRotation ? (
                <Vector3Input
                  key={boneName}
                  name={boneName}
                  position={position}
                  width={widthOfManipulators / colsPerRow}
                  value={[bone.x, bone.y, bone.z]}
                  min={-Math.PI}
                  max={Math.PI}
                  large={isPresenting}
                  onChange={(_) => {
                    setAnimation({
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
                    });
                    setHelperMessage(
                      `Bone ${boneName} set to x:${_[0].toFixed(
                        4
                      )} y:${_[1].toFixed(4)} z:${_[2].toFixed(4)}`
                    );
                  }}
                />
              ) : (
                <Vector1Input
                  key={boneName}
                  name={boneName}
                  position={position}
                  width={widthOfManipulators / colsPerRow}
                  value={[bone, 0, 0]}
                  min={-1}
                  max={1}
                  large={isPresenting}
                  onChange={(_) => {
                    setAnimation({
                      ...animation,
                      keyframes: animation.keyframes.map((keyframe, i) => {
                        if (i !== currentSelectedKeyFrame) return keyframe;
                        return {
                          ...keyframe,
                          pose: {
                            ...keyframe.pose,
                            [boneName]: _[0],
                          },
                        };
                      }),
                    });
                    setHelperMessage(
                      `Bone ${boneName} set to ${_[0].toFixed(4)}`
                    );
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
        onInteractingChanged={(_) => {
          setInteracting(_);
        }}
        position={[0, height / 2 - PADDING - 40, 0]}
        width={width * 0.9}
        currentSelectedKeyFrame={currentSelectedKeyFrame ?? undefined}
        onSelectKeyFrame={(_) => {
          setCurrentSelectedKeyFrame(_);
        }}
        setMessage={setHelperMessage}
        currentTime={currentTime}
        animation={animation}
        onTimeChange={(_) => {
          setCurrentTime(() => ({ currentTime: _ }));
        }}
      />
    </group>
  );
}
