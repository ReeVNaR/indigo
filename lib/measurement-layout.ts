type MeasurementFieldDefinition = {
    key: string;
    aliases: string[];
    label: string;
};

const MEASUREMENT_META_FIELDS = ['lastUpdated', 'notes', 'enabledOptionalFields'] as const;

const isMeasurementMetaField = (field: string) => MEASUREMENT_META_FIELDS.includes(field as (typeof MEASUREMENT_META_FIELDS)[number]);

const TOP_MEASUREMENT_FIELDS = [
    'length',
    'shoulder',
    'neck',
    'sleeve',
    'sleeve round',
    'cuff',
    'half sleeve',
    'half round',
    'chest',
    'stomach',
    'waist',
    'front a',
    'front b',
    'front c',
    'loosing',
] as const;

const TOP_OPTIONAL_MEASUREMENT_FIELDS = ['nehru', 'kurta', 'safari'] as const;

const FIELD_DEFINITIONS: MeasurementFieldDefinition[] = [
    { key: 'cut', aliases: ['cut'], label: 'Cut' },
    { key: 'pocket', aliases: ['pocket'], label: 'Pocket' },
    { key: 'length', aliases: ['length', 'len'], label: 'Len' },
    { key: 'shoulder', aliases: ['shoulder'], label: 'Shoulder' },
    { key: 'sleeve', aliases: ['sleeve', 'sleeves'], label: 'Sleeves' },
    {
        key: 'sleeve round',
        aliases: ['sleeve round', 'sleeves round', 'sleeve-round', 'sleeves-round'],
        label: 'Round',
    },
    { key: 'cuff', aliases: ['cuff'], label: 'Cuff' },
    {
        key: 'half sleeve',
        aliases: ['half sleeve', 'half sleeves', 'half-sleeve', 'half-sleeves'],
        label: 'Half Sleeves',
    },
    {
        key: 'half round',
        aliases: ['half round', 'half-round', 'half sleeve round', 'half sleeves round', 'round'],
        label: 'Round',
    },
    { key: 'neck', aliases: ['neck'], label: 'Neck' },
    { key: 'chest', aliases: ['chest'], label: 'Chest' },
    { key: 'stomach', aliases: ['stomach'], label: 'Stomach' },
    { key: 'waist', aliases: ['waist'], label: 'Waist' },
    { key: 'front a', aliases: ['front a', 'front-a', 'fronta', 'front 1', 'front-1', 'front1', 'front'], label: 'Front' },
    { key: 'front b', aliases: ['front b', 'front-b', 'frontb', 'front 2', 'front-2', 'front2'], label: 'Front' },
    { key: 'front c', aliases: ['front c', 'front-c', 'frontc', 'front 3', 'front-3', 'front3'], label: 'Front' },
    { key: 'loosing', aliases: ['loosing'], label: 'Loosing' },
    { key: 'nehru', aliases: ['nehru'], label: 'Nehru' },
    { key: 'kurta', aliases: ['kurta'], label: 'Kurta' },
    { key: 'safari', aliases: ['safari'], label: 'Safari' },
    { key: 'hip', aliases: ['hip'], label: 'Hip' },
    { key: 'thigh', aliases: ['thigh'], label: 'Thigh' },
    { key: 'knee', aliases: ['knee'], label: 'Knee' },
    { key: 'bottom', aliases: ['bottom'], label: 'Bottom' },
    { key: 'kata', aliases: ['kata'], label: 'Kata' },
    { key: 'backup', aliases: ['backup'], label: 'Backup' },
    { key: 'back pocket', aliases: ['back pocket', 'back-pocket', 'backpocket'], label: 'Back Pocket' },
    { key: 'mobile pocket', aliases: ['mobile pocket', 'mobile-pocket', 'mobilepocket'], label: 'Mobile Pocket' },
];

// Fields that are a single mutually-exclusive choice (rendered as radio buttons)
// rather than a numeric measurement. Keyed by canonical field key.
export const MEASUREMENT_CHOICE_FIELDS: Record<string, string[]> = {
    cut: ['Apple Cut', 'Bush Shirt', 'Side Cut'],
    pocket: ['Cross Pocket', 'Plate Pocket'],
};

const ROW_GROUPS = [
    ['sleeve', 'sleeve round', 'cuff'],
    ['half sleeve', 'half round'],
    ['front a', 'front b', 'front c'],
] as const;

export const measurementBaseFields = {
    shirt: ['cut', ...TOP_MEASUREMENT_FIELDS],
    pant: ['pocket', 'length', 'waist', 'hip', 'thigh', 'knee', 'bottom', 'kata', 'backup', 'back pocket', 'mobile pocket'],
    kurta: [...TOP_MEASUREMENT_FIELDS],
    suit: [...TOP_MEASUREMENT_FIELDS],
    vest: ['length', 'shoulder', 'neck', 'chest', 'stomach', 'waist', 'front a', 'front b', 'front c', 'loosing'],
    customTop: [...TOP_MEASUREMENT_FIELDS],
    customBottom: ['length', 'waist', 'hip', 'thigh', 'knee', 'bottom', 'kata', 'backup', 'back pocket', 'mobile pocket'],
} as const;

export const measurementOptionalFields = {
    shirt: [...TOP_OPTIONAL_MEASUREMENT_FIELDS],
    pant: [],
    kurta: [...TOP_OPTIONAL_MEASUREMENT_FIELDS],
    suit: [...TOP_OPTIONAL_MEASUREMENT_FIELDS],
    vest: [...TOP_OPTIONAL_MEASUREMENT_FIELDS],
    customTop: [...TOP_OPTIONAL_MEASUREMENT_FIELDS],
    customBottom: [],
} as const;

const SECTION_DEFINITIONS = [
    {
        key: 'structure',
        title: 'Structure',
        fields: ['length', 'shoulder', 'neck'],
    },
    {
        key: 'sleeves',
        title: 'Sleeves',
        fields: ['sleeve', 'sleeve round', 'cuff', 'half sleeve', 'half round'],
    },
    {
        key: 'body',
        title: 'Body Fit',
        fields: ['chest', 'stomach', 'waist', 'hip', 'thigh', 'knee', 'bottom', 'front a', 'front b', 'front c', 'kata', 'backup', 'back pocket', 'mobile pocket'],
    },
    {
        key: 'style',
        title: 'Style Details',
        fields: ['loosing', 'nehru', 'kurta'],
    },
    {
        key: 'other',
        title: 'Other Measurements',
        fields: [],
    },
] as const;

const normalizeMeasurementField = (field: string) =>
    field
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const getFieldDefinition = (field: string) => {
    const normalized = normalizeMeasurementField(field);
    return FIELD_DEFINITIONS.find((definition) => definition.aliases.includes(normalized));
};

const getCanonicalMeasurementField = (field: string) => getFieldDefinition(field)?.key || normalizeMeasurementField(field);

const isSameMeasurementField = (first: string, second: string) =>
    getCanonicalMeasurementField(first) === getCanonicalMeasurementField(second);

export const getMeasurementChoiceOptions = (field: string): string[] | null => {
    const canonicalField = getCanonicalMeasurementField(field);
    return MEASUREMENT_CHOICE_FIELDS[canonicalField] ?? null;
};

export const isMeasurementChoiceField = (field: string) => getMeasurementChoiceOptions(field) !== null;

const getFieldPriority = (field: string) => {
    const canonicalField = getCanonicalMeasurementField(field);
    const matchIndex = FIELD_DEFINITIONS.findIndex((definition) => definition.key === canonicalField);
    return matchIndex === -1 ? Number.MAX_SAFE_INTEGER : matchIndex;
};

export const getMeasurementValue = (data: Record<string, any> | undefined, field: string) => {
    if (!data) return '';
    if (Object.prototype.hasOwnProperty.call(data, field)) return data[field];

    const matchingKey = Object.keys(data).find(
        (candidate) => !isMeasurementMetaField(candidate) && isSameMeasurementField(candidate, field)
    );

    return matchingKey ? data[matchingKey] : '';
};

export const getExtraMeasurementFields = (baseFields: ReadonlyArray<string>, data?: Record<string, any>) =>
    Object.keys(data || {}).filter(
        (key) => !isMeasurementMetaField(key) && !baseFields.some((baseField) => isSameMeasurementField(baseField, key))
    );

export const isMeasurementComplete = (baseFields: ReadonlyArray<string>, data?: Record<string, any>) =>
    baseFields.every((field) => {
        const value = getMeasurementValue(data, field);
        return value !== undefined && value !== null && String(value).trim() !== '';
    });

export const getOrderedMeasurementFields = (baseFields: ReadonlyArray<string>, data?: Record<string, any>) => {
    const extraFields = getExtraMeasurementFields(baseFields, data);
    const allFields = [...baseFields, ...extraFields];
    const dedupedFields = allFields.filter(
        (field, index) => index === allFields.findIndex((candidate) => isSameMeasurementField(candidate, field))
    );

    return dedupedFields.sort((first, second) => {
        const priorityDiff = getFieldPriority(first) - getFieldPriority(second);
        if (priorityDiff !== 0) return priorityDiff;

        const firstIndex = allFields.findIndex((candidate) => isSameMeasurementField(candidate, first));
        const secondIndex = allFields.findIndex((candidate) => isSameMeasurementField(candidate, second));
        return firstIndex - secondIndex;
    });
};

export const getMeasurementFieldRows = (baseFields: ReadonlyArray<string>, data?: Record<string, any>) => {
    const orderedFields = getOrderedMeasurementFields(baseFields, data);
    const consumed = new Set<number>();
    const rows: string[][] = [];

    orderedFields.forEach((field, index) => {
        if (consumed.has(index)) return;

        const canonicalField = getCanonicalMeasurementField(field);
        const matchingGroup = ROW_GROUPS.find((group) => group.includes(canonicalField as never));

        if (!matchingGroup) {
            consumed.add(index);
            rows.push([field]);
            return;
        }

        const rowFields = matchingGroup
            .map((groupField) => {
                const matchIndex = orderedFields.findIndex(
                    (candidate, candidateIndex) =>
                        !consumed.has(candidateIndex) && isSameMeasurementField(candidate, groupField)
                );

                if (matchIndex === -1) return null;

                consumed.add(matchIndex);
                return orderedFields[matchIndex];
            })
            .filter((value): value is string => Boolean(value));

        if (rowFields.length === 0) {
            consumed.add(index);
            rows.push([field]);
            return;
        }

        rows.push(rowFields);
    });

    return rows;
};

export const getMeasurementSections = (baseFields: ReadonlyArray<string>, data?: Record<string, any>) => {
    const rows = getMeasurementFieldRows(baseFields, data);

    return SECTION_DEFINITIONS.map((section) => {
        const sectionRows = rows.filter((row) =>
            row.some((field) => {
                const canonicalField = getCanonicalMeasurementField(field);
                return section.fields.length === 0
                    ? !SECTION_DEFINITIONS.some(
                        (candidate) => candidate.fields.length > 0 && candidate.fields.includes(canonicalField as never)
                    )
                    : section.fields.includes(canonicalField as never);
            })
        );

        return {
            key: section.key,
            title: section.title,
            rows: sectionRows,
        };
    }).filter((section) => section.rows.length > 0);
};

export const getEnabledOptionalMeasurementFields = (data?: Record<string, any>) => {
    const value = data?.enabledOptionalFields;
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean);
};

export const getVisibleMeasurementFields = (
    baseFields: ReadonlyArray<string>,
    data?: Record<string, any>,
    optionalFields: ReadonlyArray<string> = []
) => {
    const enabledOptionalFields = getEnabledOptionalMeasurementFields(data);
    const visibleOptionalFields = optionalFields.filter((field) => enabledOptionalFields.includes(field));

    return [...baseFields, ...visibleOptionalFields];
};

export const formatMeasurementLabel = (field: string) => {
    const knownLabel = getFieldDefinition(field)?.label;
    if (knownLabel) return knownLabel;

    return field
        .replace(/[_-]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

export const isFrontMeasurementField = (field: string) => {
    const canonicalField = getCanonicalMeasurementField(field);
    return canonicalField === 'front a' || canonicalField === 'front b' || canonicalField === 'front c';
};

export const isFrontMeasurementRow = (row: ReadonlyArray<string>) =>
    row.length === 3 && row.every((field) => isFrontMeasurementField(field));

export const getMeasurementNotes = (data?: Record<string, any>) => {
    const value = data?.notes;
    return value === undefined || value === null ? '' : String(value);
};
