
import { PathRequest, Point, VersionInfo } from './types';
import { routeWireV1, V1_0_METADATA } from './versions/v1.0';
import { routeWireV1_2, V1_2_METADATA } from './versions/v1.2';
import { routeWireV1_3, V1_3_METADATA } from './versions/v1.3';
import { routeWireV1_3_1, V1_3_1_METADATA } from './versions/v1.3.1';
import { routeWireV1_4, V1_4_METADATA } from './versions/v1.4';
import { routeWireV1_4_3, V1_4_3_METADATA } from './versions/v1.4.3';
import { routeWireV1_4_4, V1_4_4_METADATA } from './versions/v1.4.4';
import { routeWireV1_4_4_1, V1_4_4_1_METADATA } from './versions/v1.4.4.1';
import { routeWireV1_5, V1_5_METADATA } from './versions/v1.5';
import { routeWireV1_5_1, V1_5_1_METADATA } from './versions/v1.5.1';
import { routeWireV1_5_2, V1_5_2_METADATA } from './versions/v1.5.2';
import { routeWireV1_6, V1_6_METADATA } from './versions/v1.6';

// 1. Registry of available algorithms
// Order matters: determines the display order in the UI
export const AVAILABLE_VERSIONS: VersionInfo[] = [
    V1_6_METADATA,
    V1_5_2_METADATA,
    V1_5_1_METADATA,
    V1_5_METADATA,
    V1_4_4_1_METADATA,
    V1_4_4_METADATA,
    V1_4_3_METADATA,
    V1_4_METADATA,
    V1_3_1_METADATA,
    V1_3_METADATA,
    V1_2_METADATA,
    V1_0_METADATA
];

// 2. Map of version IDs to their implementation functions
export const ROUTING_STRATEGIES: Record<string, (req: PathRequest) => Point[]> = {
    [V1_0_METADATA.version]: routeWireV1,
    [V1_2_METADATA.version]: routeWireV1_2,
    [V1_3_METADATA.version]: routeWireV1_3,
    [V1_3_1_METADATA.version]: routeWireV1_3_1,
    [V1_4_METADATA.version]: routeWireV1_4,
    [V1_4_3_METADATA.version]: routeWireV1_4_3,
    [V1_4_4_METADATA.version]: routeWireV1_4_4,
    [V1_4_4_1_METADATA.version]: routeWireV1_4_4_1,
    [V1_5_METADATA.version]: routeWireV1_5,
    [V1_5_1_METADATA.version]: routeWireV1_5_1,
    [V1_5_2_METADATA.version]: routeWireV1_5_2,
    [V1_6_METADATA.version]: routeWireV1_6,
};
