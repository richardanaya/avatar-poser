import { GroupProps, ThreeEvent } from "@react-three/fiber"
import { useEffect, useState } from "react";
import { PoseAnimation } from "./Poser";
import { Text } from "@react-three/drei";
import { allBones } from "./allBones";
import { Vector3 } from "three";

export type PoserHudProps = {
    width: number
    height: number
    onTimeChange: (time: number) => void
    onAnimationChange: (animation: PoseAnimation) => void
} & GroupProps

const PADDING = 10;



const NumericSliderInput = ({ name, value, width, min, max, onChange, ...groupProps }: {
    name: string,
    value: number,
    width: number,
    min: number,
    max: number,
    onChange: (value: number) => void
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
    }

    const handleMouseMove = (e: ThreeEvent<PointerEvent>) => {
        if (isDragging) {
            const delta = e.clientX - dragStartX;
            const newValue = dragStartValue + delta / width * (max - min);
            onChange(newValue);
            setDidMove(true);
        }
    }

    const handleMouseUp = (e: ThreeEvent<PointerEvent>) => {
        setIsDragging(false);
        if (!didMove) {
            onChange(value);
        }
    }

    return <group {...groupProps} onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp}>
        <mesh position={[width / 2, 0, -1]}>
            <planeGeometry args={[width, 5]} />
            <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[value / (max - min) * width, 0, 0]}>
            <planeGeometry args={[5, 5]} />
            <meshBasicMaterial color="red" />
        </mesh>
    </group >
}

const VectorInput = ({ name, value, width, min, max, onChange, ...groupProps }: {
    name: string,
    value: [number, number, number],
    width: number,
    min: number,
    max: number,
    onChange: (value: [number, number, number]) => void
} & GroupProps) => {
    return <group {...groupProps}>
        <Text position={[10, 0, 0]} color="white" fontSize={1} scale={[10, 10, 10]} anchorX="left" anchorY="middle">{name}</Text>
        <NumericSliderInput name="x" value={value[0]} width={width * 2 / 3} min={min} max={max} onChange={_ => onChange([_, value[1], value[2]])} position={[width * 1 / 3, -8, 0]} />
        <NumericSliderInput name="y" value={value[1]} width={width * 2 / 3} min={min} max={max} onChange={_ => onChange([value[0], _, value[2]])} position={[width * 1 / 3, 0, 0]} />
        <NumericSliderInput name="z" value={value[2]} width={width * 2 / 3} min={min} max={max} onChange={_ => onChange([value[0], value[1], _])} position={[width * 1 / 3, 8, 0]} />
    </group>
}


const Button = ({ text, onClick, position, ...groupProps }: {
    text: string
    onClick: () => void
    position: [number, number, number]
} & GroupProps) => {
    return <group {...groupProps} position={position} onClick={onClick}>
        <Text
            scale={[10, 10, 10]}
            color="white"
            anchorX="center"
            anchorY="middle"
            fontSize={1.5}
        >
            {text}
        </Text>
    </group>
}

const Timeline = ({ width, currentTime, animation, onTimeChange, currentSelectedKeyFrame, onSelectKeyFrame, ...groupProps }:
    { width: number, currentTime: number, animation: PoseAnimation, currentSelectedKeyFrame: number | undefined, onSelectKeyFrame: (index: number) => void, onTimeChange: (time: number) => void } & GroupProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragStartCurrentTime, setDragStartCurrentTime] = useState(0);
    const [didMove, setDidMove] = useState(false);

    const handleMouseDown = (e: ThreeEvent<PointerEvent>) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragStartCurrentTime(currentTime);
    }

    const handleMouseMove = (e: ThreeEvent<PointerEvent>) => {
        if (isDragging) {
            const delta = e.clientX - dragStartX;
            const newTime = dragStartCurrentTime + delta / width * animation.length;
            onTimeChange(Math.max(0, Math.min(animation.length, newTime)));
        }
    }

    const handleMouseUp = () => {
        console.log("mouse up");
        setIsDragging(false);
    }

    return <group {...groupProps} onPointerDown={handleMouseDown} onPointerMove={handleMouseMove} onPointerUp={handleMouseUp}>
        <mesh position={[0, 0, 0]} scale={[width, 10, 1]}>
            <planeGeometry />
            <meshBasicMaterial color="white" />
        </mesh>
        <mesh position={[currentTime / animation.length * width - width / 2, 0, 0]} scale={[10, 10, 3]}>
            <planeGeometry />
            <meshBasicMaterial color="red" />
        </mesh>
        {animation.length > 0 && animation.keyframes.map(({ time }, i) => {
            return <mesh key={i} position={[time / animation.length * width - width / 2, 0, 0]} scale={[10, 10, 1]} onPointerDown={_ => {
                onSelectKeyFrame(i);
            }}>
                <planeGeometry />
                <meshBasicMaterial color={currentSelectedKeyFrame === i ? "blue" : "green"} transparent opacity={.4} />
            </mesh>
        })}
    </group>
}


export function PoserHud({ width, height, onAnimationChange, ...groupProps }: PoserHudProps) {
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSelectedKeyFrame, setCurrentSelectedKeyFrame] = useState<number | null>(null);
    const [showBoneNames, setShowBoneNames] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [animation, setAnimation] = useState<PoseAnimation>({
        length: 15,
        keyframes: [
            {
                time: 0,
                pose: {
                }
            }
        ]
    });
    const [playIntervalHandle, setPlayIntervalHandle] = useState<number | null>(null);

    useEffect(() => {
        onAnimationChange(animation);
    }, [animation]);

    useEffect(() => {
        if (isPlaying) {
            const handle = setInterval(() => {
                setCurrentTime(currentTime => {
                    const newTime = currentTime + .1;
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

    const currentKeyFrame = currentSelectedKeyFrame ? animation.keyframes[currentSelectedKeyFrame] : undefined;

    if (minimized) {
        return <group {...groupProps} >
            <mesh position={[width / 2 - width / 30 / 2, -height / 2 + width / 30 / 2, -1]}
                onPointerUp={() => setMinimized(false)}
            >
                <boxGeometry args={[width / 30, width / 30]} />
                < meshBasicMaterial color="black" transparent opacity={.3} />
            </mesh>
        </group>
    }

    if (showBoneNames) {
        const allKnownBoneNames = [...allBones.sort()];
        const currentBoneNames = currentKeyFrame ? Object.keys(currentKeyFrame.pose) : [];
        const remainingBones = allKnownBoneNames.filter(boneName => !currentBoneNames.includes(boneName));

        return <group {...groupProps} >
            <mesh position={[0, 0, -1]}>
                <boxGeometry args={[width, height,]} />
                < meshBasicMaterial color="black" transparent opacity={.3} />
            </mesh>
            {remainingBones.map((boneName, i) => {
                const colsPerRow = 7;
                const row = Math.floor(i / colsPerRow);
                const col = i % colsPerRow;
                return <Text
                    key={boneName}
                    scale={[10, 10, 10]}
                    color="white"
                    anchorX="left"
                    anchorY="top"
                    fontSize={1}
                    position={[-width / 2 + (width / colsPerRow) * col, height / 2 - 10 - row * 20, 0]}
                    onPointerUp={_ => {
                        setAnimation(animation => {
                            const newAnimation = {
                                ...animation,
                                keyframes: animation.keyframes.map((keyframe, i) => {
                                    if (i !== currentSelectedKeyFrame) return keyframe;
                                    return {
                                        ...keyframe,
                                        pose: {
                                            ...keyframe.pose,
                                            [boneName]: (["MouthSmile", "MouthOpen"].includes(boneName) ? 0 : {
                                                x: 0,
                                                y: 0,
                                                z: 0
                                            })
                                        }
                                    }
                                })
                            }
                            return newAnimation;
                        });
                        setShowBoneNames(false);
                    }}
                >
                    {boneName}
                </Text>
            })}

        </group>
    }

    return <group {...groupProps} >
        <mesh position={[0, 0, -1]}>
            <boxGeometry args={[width, height,]} />
            < meshBasicMaterial color="black" transparent opacity={.3} />
        </mesh>
        <Text
            scale={[10, 10, 10]}
            color="white"
            anchorX="left"
            anchorY="top"
            fontSize={1.5}
            position={[-width / 2 + PADDING, height / 2 - PADDING, 0]}
        >
            Time: {currentTime.toFixed(2)}/{animation.length.toFixed(2)} seconds
        </Text>
        <Button
            text={isPlaying ? "Pause" : "Play"}
            position={[-width / 2 + PADDING, -height / 2 + PADDING, 0]}
            onClick={() => {
                isPlaying ? setIsPlaying(false) : setIsPlaying(true);
            }}
        />
        <Button
            text="Restart"
            position={[0, -height / 2 + PADDING, 0]}
            onClick={() => {
                setCurrentTime(0);
            }}
        />
        <Button
            text="Download Animation"
            position={[width / 2 - PADDING, -height / 2 + PADDING + 25, 0]}
            onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([JSON.stringify(animation)], { type: 'text/plain' });
                element.href = URL.createObjectURL(file);
                element.download = "animation.json";
                document.body.appendChild(element); // Required for this to work in FireFox
                element.click();
            }}
        />

        <Button
            text="Minimize"
            position={[width / 2 - PADDING, -height / 2 + PADDING, 0]}
            onClick={() => {
                setMinimized(true);
            }}
        />

        <Button
            text="Add Keyframe"
            position={[width / 2 - PADDING, -height / 2 + PADDING + 50, 0]}
            onClick={() => {
                setAnimation({
                    ...animation,
                    keyframes: [...animation.keyframes, {
                        time: currentTime,
                        pose: {
                        }
                    }]
                });
                setCurrentSelectedKeyFrame(animation.keyframes.length);
            }}
        />



        {
            currentKeyFrame && <>
                <Button
                    text="Add Bone"
                    position={[width / 2 - PADDING, -height / 2 + PADDING + 100, 0]}
                    onClick={() => {
                        setShowBoneNames(true);
                    }}
                />
                <Button
                    text="Delete Bone"
                    position={[width / 2 - PADDING, -height / 2 + PADDING + 125, 0]}
                    onClick={() => {
                    }} />
                <Button
                    text="Delete Keyframe"
                    position={[width / 2 - PADDING, -height / 2 + PADDING + 75, 0]}
                    onClick={() => {
                        setAnimation({
                            ...animation,
                            keyframes: animation.keyframes.filter((_, i) => i !== currentSelectedKeyFrame)
                        });
                        setCurrentSelectedKeyFrame(null);
                    }}
                />
                {Object.keys(currentKeyFrame.pose).length === 0 ? (<Text
                    scale={[10, 10, 10]}
                    color="white"
                    anchorX="center"
                    anchorY="top"
                    fontSize={1}
                    position={[0, 0, 0]}
                >
                    No bones being animated in this keyframe.
                </Text>) : (
                    Object.entries(currentKeyFrame.pose).map(([boneName, bone], i) => {
                        const widthOfManipulators = width * 4 / 5;
                        const colsPerRow = 3;
                        const row = Math.floor(i / colsPerRow);
                        const col = i % colsPerRow;
                        const isRotation = true; !["MouthSmile", "MouthOpen"].includes(boneName);
                        const position = new Vector3(-width / 2 + (widthOfManipulators / colsPerRow) * col + 30, height / 2 - 10 - row * 20 - 50, 0);
                        return (isRotation ?
                            <VectorInput key={boneName} name={boneName} position={position} width={widthOfManipulators / colsPerRow} value={[bone.x, bone.y, bone.z]} min={-2 * Math.PI} max={2 * Math.PI} onChange={_ => {
                                setAnimation(animation => {
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
                                                        z: _[2]
                                                    }
                                                }
                                            }
                                        })
                                    }
                                    return newAnimation;
                                });
                            }} /> :
                            <NumericSliderInput key={boneName} name={boneName} position={position} width={widthOfManipulators / colsPerRow} value={bone as number} min={0} max={1} onChange={_ => {
                                setAnimation(animation => {
                                    const newAnimation = {
                                        ...animation,
                                        keyframes: animation.keyframes.map((keyframe, i) => {
                                            if (i !== currentSelectedKeyFrame) return keyframe;
                                            return {
                                                ...keyframe,
                                                pose: {
                                                    ...keyframe.pose,
                                                    [boneName]: _
                                                }
                                            }
                                        })
                                    }
                                    return newAnimation;
                                }
                                );
                            }} />)
                    }))
                }
            </>
        }
        {!currentKeyFrame && < Text
            scale={[10, 10, 10]}
            color="white"
            anchorX="center"
            anchorY="top"
            fontSize={1}
            position={[0, 0, 0]}
        >
            {animation.keyframes.length === 0 ? "No keyframes in this animation." : "Select a keyframe to edit it."}
        </Text>
        }
        <Timeline position={[0, height / 2 - PADDING - 30, 0]} width={width * .9} currentSelectedKeyFrame={currentSelectedKeyFrame ?? undefined} onSelectKeyFrame={_ => {
            setCurrentSelectedKeyFrame(_);
        }} currentTime={currentTime} animation={animation} onTimeChange={_ => {
            setCurrentTime(_);
        }} />
    </group >;
}