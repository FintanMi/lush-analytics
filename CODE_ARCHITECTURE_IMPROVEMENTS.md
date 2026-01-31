# Code Architecture Improvements

## Overview

This document addresses the architectural enhancements made to improve code quality through abstraction, encapsulation, polymorphism, inheritance, and advanced TypeScript features.

## 1. Abstraction & Encapsulation

### Cookie Utilities (sidebar.tsx)

**Before**: Direct cookie manipulation scattered throughout code
**After**: Encapsulated cookie operations in a utility object

```typescript
const cookieUtils = {
  get: (name: string): string | null => { /* ... */ },
  set: (name: string, value: string, maxAge: number): void => { /* ... */ },
  getBoolean: (name: string, defaultValue: boolean): boolean => { /* ... */ },
} as const;
```

**Benefits**:
- Single source of truth for cookie operations
- Easy to mock for testing
- Consistent error handling
- Type-safe operations

### Algorithm Configuration (advanced-algorithms.ts)

**Abstraction**: Separated configuration from implementation
- Configuration: `src/config/advanced-algorithms.ts`
- Implementation: `src/services/advanced-algorithms.ts`

**Benefits**:
- Easy to adjust thresholds without touching logic
- Configuration can be moved to database
- Clear separation of concerns
- Testable in isolation

## 2. Polymorphism

### Generic State Setter Type

```typescript
type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
```

**Usage**:
```typescript
const setOpen: StateSetter<boolean> = ...
const setOpenMobile: StateSetter<boolean> = ...
```

**Benefits**:
- Reusable across different state types
- Type-safe state updates
- Supports both direct values and updater functions

### Generic Provider Props

```typescript
type ProviderProps<T extends React.ElementType> = React.ComponentProps<T> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};
```

**Benefits**:
- Flexible component composition
- Type inference from element type
- Extensible for future props

## 3. Template Literal Types

### Sidebar Types

```typescript
type SidebarState = "expanded" | "collapsed";
type SidebarSide = "left" | "right";
type SidebarVariant = "sidebar" | "floating" | "inset";
type SidebarCollapsible = "offcanvas" | "icon" | "none";
```

**Benefits**:
- Compile-time validation
- Autocomplete in IDEs
- Prevents typos
- Self-documenting code

### Algorithm Types

```typescript
const ADVANCED_ALGORITHMS = {
  TIME_SERIES: {
    MATRIX_PROFILE: 'matrix_profile',
    BOCPD: 'bayesian_change_point',
    // ...
  } as const,
} as const;
```

**Benefits**:
- String literal types for algorithm names
- Type-safe algorithm selection
- Prevents invalid algorithm references

## 4. Union Types

### Data Sufficiency

```typescript
type DataSufficiency = 'insufficient' | 'minimal' | 'adequate' | 'optimal';
```

**Usage in Multiple Interfaces**:
```typescript
interface AnomalyMetrics {
  dataSufficiency: DataSufficiency;
}

interface PredictionResponse {
  metadata: {
    dataSufficiency: DataSufficiency;
  };
}
```

**Benefits**:
- Consistent across entire codebase
- Type-safe comparisons
- Easy to extend

### Confidence Impact

```typescript
type ConfidenceImpact = 'none' | 'minor' | 'moderate' | 'severe';
```

**Benefits**:
- Clear severity levels
- Type-safe severity checks
- Prevents invalid values

## 5. Optional Chaining

### Safe Property Access

```typescript
// In signal quality calculations
const highQuality = thresholds.find(t => t.name === 'quality_high')?.value ?? 0.8;
const cookie = document.cookie
  .split("; ")
  .find((c) => c.startsWith(`${name}=`));
return cookie?.split("=")[1] ?? null;
```

**Benefits**:
- No runtime errors on undefined
- Cleaner than nested if statements
- Default values with nullish coalescing

### Component Props

```typescript
onClick?.(event);  // Safe function call
rule?.confidence_impact || 'moderate'  // Safe property access
```

## 6. Nullable Types

### Explicit Null Handling

```typescript
interface TemporalCoverage {
  gaps: Array<{ start: number; end: number }>;  // Never null, can be empty
}

interface AlertToActionLatency {
  action_taken_at: number | null;  // Explicitly nullable
  latency_ms: number | null;
  action_type: string | null;
}
```

**Benefits**:
- Clear intent: null means "not yet happened"
- Type-safe null checks
- Prevents undefined errors

### Context Null Safety

```typescript
const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
```

**Benefits**:
- Enforces provider usage
- Clear error messages
- Type narrowing after null check

## 7. Generics with React Components

### Visualization Component Pattern

```typescript
interface LiveDAGHeatmapProps {
  data: LiveDAGHeatmap | null;
  loading?: boolean;
}

export default function LiveDAGHeatmapVisualization({ 
  data, 
  loading 
}: LiveDAGHeatmapProps) {
  // Component implementation
}
```

**Benefits**:
- Reusable component pattern
- Type-safe props
- Consistent API across visualizations

### Generic Utility Functions

```typescript
function mean(data: number[]): number {
  return data.length > 0 
    ? data.reduce((sum, val) => sum + val, 0) / data.length 
    : 0;
}

function variance(data: number[]): number {
  const m = mean(data);
  return data.length > 0 
    ? data.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / data.length 
    : 0;
}
```

**Benefits**:
- Reusable across algorithms
- Type-safe operations
- Composable functions

## 8. Type Coercion & Type Guards

### Safe Type Coercion

```typescript
// Boolean coercion from cookie
getBoolean: (name: string, defaultValue: boolean): boolean => {
  const value = cookieUtils.get(name);
  return value === null ? defaultValue : value === "true";
}
```

**Benefits**:
- Explicit conversion
- No implicit coercion bugs
- Default value handling

### Type Guards

```typescript
// In algorithm selection
if (dataPoints < 30) {
  return ['seasonal_hybrid_esd'];
} else if (dataPoints < 100) {
  return ['seasonal_hybrid_esd', 'dynamic_time_warping'];
}
```

**Benefits**:
- Clear branching logic
- Type narrowing
- Easy to test

## 9. Const Assertions

### Immutable Configuration

```typescript
export const MATRIX_PROFILE_CONFIG = {
  windowSize: 50,
  minMotifSimilarity: 0.85,
  discordThreshold: 2.5,
  useFFTAcceleration: true,
  maxComputationTimeMs: 5000,
} as const;
```

**Benefits**:
- Readonly at compile time
- Prevents accidental mutations
- Better type inference

### Enum-like Objects

```typescript
const SIGNAL_QUALITY = {
  REGIMES: {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    DEGENERATE: 'degenerate',
  } as const,
} as const;
```

**Benefits**:
- String literal types
- No enum overhead
- Tree-shakeable

## 10. Advanced Patterns

### Factory Pattern (Algorithm Selection)

```typescript
export const selectAlgorithms = (
  dataPoints: number,
  tier: string
): string[] => {
  // Algorithm selection logic
};
```

**Benefits**:
- Centralized algorithm selection
- Easy to test
- Configurable behavior

### Strategy Pattern (Algorithm Execution)

```typescript
const ALGORITHM_SELECTION_STRATEGIES: Record<string, AlgorithmStrategy> = {
  insufficient_data: {
    dataPoints: 30,
    tier: 'basic',
    algorithms: ['seasonal_hybrid_esd'],
    fallbackChain: ['simple_threshold'],
  },
  // ...
};
```

**Benefits**:
- Pluggable algorithms
- Easy to add new strategies
- Clear fallback chains

### Observer Pattern (React Context)

```typescript
const SidebarContext = React.createContext<SidebarContextProps | null>(null);

// Provider observes state changes
const contextValue = React.useMemo(
  () => ({
    state,
    open,
    setOpen,
    toggleSidebar,
  }),
  [state, open, setOpen, toggleSidebar]
);
```

**Benefits**:
- Reactive updates
- Memoized for performance
- Decoupled components

## 11. Recommendations for Further Improvement

### 1. Extract Common Visualization Logic

Create a base visualization component:

```typescript
interface BaseVisualizationProps<T> {
  data: T | null;
  loading?: boolean;
  emptyMessage?: string;
}

function BaseVisualization<T>({ 
  data, 
  loading, 
  emptyMessage,
  children 
}: BaseVisualizationProps<T> & { children: (data: T) => React.ReactNode }) {
  if (loading) return <Skeleton />;
  if (!data) return <EmptyState message={emptyMessage} />;
  return <>{children(data)}</>;
}
```

### 2. Use Discriminated Unions

For algorithm results:

```typescript
type AlgorithmResult = 
  | { type: 'matrix_profile'; data: MatrixProfileResult }
  | { type: 'bocpd'; data: BayesianChangePoint }
  | { type: 'seasonal_esd'; data: SeasonalHybridESDResult };

function processResult(result: AlgorithmResult) {
  switch (result.type) {
    case 'matrix_profile':
      // TypeScript knows result.data is MatrixProfileResult
      break;
    // ...
  }
}
```

### 3. Implement Builder Pattern

For complex configuration:

```typescript
class AlgorithmConfigBuilder {
  private config: Partial<AlgorithmConfig> = {};
  
  withWindowSize(size: number) {
    this.config.windowSize = size;
    return this;
  }
  
  withThreshold(threshold: number) {
    this.config.threshold = threshold;
    return this;
  }
  
  build(): AlgorithmConfig {
    return this.config as AlgorithmConfig;
  }
}
```

### 4. Use Branded Types

For type safety:

```typescript
type SellerId = string & { readonly __brand: 'SellerId' };
type QueryId = string & { readonly __brand: 'QueryId' };

function processSeller(id: SellerId) { /* ... */ }
function processQuery(id: QueryId) { /* ... */ }

// Prevents mixing up IDs
processSeller(queryId);  // Type error!
```

## 12. Summary

### Improvements Made

1. **Abstraction**: Cookie utilities, algorithm configuration separation
2. **Encapsulation**: Context-based state management, utility functions
3. **Polymorphism**: Generic types for state setters and props
4. **Template Literals**: String literal types for states and variants
5. **Union Types**: Data sufficiency, confidence impact, severity levels
6. **Optional Chaining**: Safe property access throughout
7. **Nullable Types**: Explicit null handling in interfaces
8. **Generics**: Reusable component and function patterns
9. **Type Coercion**: Safe boolean conversion from strings
10. **Const Assertions**: Immutable configuration objects

### Benefits Achieved

- **Type Safety**: Compile-time error detection
- **Maintainability**: Clear separation of concerns
- **Testability**: Isolated, mockable components
- **Reusability**: Generic patterns across codebase
- **Documentation**: Self-documenting types
- **Performance**: Memoization and const assertions
- **Developer Experience**: Better autocomplete and error messages

---

**Last Updated**: 2026-01-21
**Version**: 2.0.0
