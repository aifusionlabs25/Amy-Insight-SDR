'use client';

import React, { useEffect, useCallback } from "react";
import {
    DailyAudioTrack,
    DailyVideo,
    useDevices,
    useLocalSessionId,
    useMeetingState,
    useScreenVideoTrack,
    useVideoTrack,
    useDaily
} from "@daily-co/daily-react";
import { MicSelectBtn, CameraSelectBtn, ScreenShareButton } from '../device-select'
import { useLocalScreenshare } from "../../hooks/use-local-screenshare";
import { useReplicaIDs } from "../../hooks/use-replica-ids";
import { useCVICall } from "../../hooks/use-cvi-call";
import { AudioWave } from "../audio-wave";

import styles from "./conversation.module.css";

interface ConversationProps {
    onLeave: () => void;
    conversationUrl: string;
}

const VideoPreview = React.memo(({ id }: { id: string }) => {
    const videoState = useVideoTrack(id);
    const widthVideo = videoState.track?.getSettings()?.width;
    const heightVideo = videoState.track?.getSettings()?.height;
    const isVertical = widthVideo && heightVideo ? widthVideo < heightVideo : false;

    return (
        <div
            className={`${styles.previewVideoContainer} ${isVertical ? styles.previewVideoContainerVertical : ''} ${videoState.isOff ? styles.previewVideoContainerHidden : ''}`}
        >
            <DailyVideo
                automirror
                sessionId={id}
                type="video"
                className={`${styles.previewVideo} ${isVertical ? styles.previewVideoVertical : ''} ${videoState.isOff ? styles.previewVideoHidden : ''}`}
            />
            <div className={styles.audioWaveContainer}>
                <AudioWave id={id} />
            </div>
        </div>
    );
});

const PreviewVideos = React.memo(() => {
    const localId = useLocalSessionId();
    const { isScreenSharing } = useLocalScreenshare();
    const replicaIds = useReplicaIDs();
    const replicaId = replicaIds[0];

    return (
        <>
            {isScreenSharing && (
                <VideoPreview id={replicaId} />
            )}
            <VideoPreview id={localId} />
        </>
    );
});

const MainVideo = React.memo(() => {
    const replicaIds = useReplicaIDs();
    const localId = useLocalSessionId();
    const videoState = useVideoTrack(replicaIds[0]);
    const screenVideoState = useScreenVideoTrack(localId);
    const isScreenSharing = !screenVideoState.isOff;
    const replicaId = replicaIds[0];

    if (!replicaId) {
        return (
            <div className={styles.waitingContainer}>
                <p>Connecting...</p>
            </div>
        );
    }

    return (
        <div
            className={`${styles.mainVideoContainer} ${isScreenSharing ? styles.mainVideoContainerScreenSharing : ''}`}
        >
            <DailyVideo
                automirror
                sessionId={isScreenSharing ? localId : replicaId}
                type={isScreenSharing ? "screenVideo" : "video"}
                className={`${styles.mainVideo}
				${isScreenSharing ? styles.mainVideoScreenSharing : ''}
				${videoState.isOff ? styles.mainVideoHidden : ''}`}
            />
            <DailyAudioTrack sessionId={replicaId} />
        </div>
    );
});

export const Conversation = React.memo(({ onLeave, conversationUrl }: ConversationProps) => {
    const { joinCall, leaveCall } = useCVICall();
    const meetingState = useMeetingState();
    const { hasMicError } = useDevices()

    useEffect(() => {
        if (meetingState === 'error') {
            onLeave();
        }
    }, [meetingState, onLeave]);

    const daily = useDaily();

    useEffect(() => {
        if (!daily) return;

        const handleAppMessage = (event: any) => {
            console.log('[Conversation] 🔔 App Message Received:', event);
            const data = event?.data;
            if (data?.event === 'tool_call' && data?.name === 'search_assist') {
                const query = data.arguments?.query_text || data.arguments?.query;
                console.log('[Conversation] 🎯 Search Tool Detected:', query);
                if (query && (window as any).amySearchAssist) {
                    (window as any).amySearchAssist(query);
                }
            }
        };

        daily.on('app-message', handleAppMessage);
        return () => {
            daily.off('app-message', handleAppMessage);
        };
    }, [daily]);

    useEffect(() => {
        joinCall({ url: conversationUrl });
    }, []);

    const handleLeave = useCallback(() => {
        leaveCall();
        onLeave();
    }, [leaveCall, onLeave]);

    return (
        <div className={styles.container}>
            <div className={styles.videoContainer}>
                {
                    hasMicError && (
                        <div className={styles.errorContainer}>
                            <p>
                                Camera or microphone access denied. Please check your settings and try again.
                            </p>
                        </div>
                    )}

                <div className={styles.mainVideoContainer}>
                    <MainVideo />
                </div>

                <div className={styles.selfViewContainer}>
                    <PreviewVideos />
                </div>
            </div>

        </div>
    );
});
