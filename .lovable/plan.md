

# Individual Resource Saving with Error Tracking

## Problem Identified

Currently, `ModuleResourcesManager.tsx` has a **bulk save approach** that:
1. Saves ALL resources in one operation (lines 316-429)
2. Shows a single success/error message for the entire batch
3. Makes it impossible to identify which resource failed
4. User loses JSON data, YouTube links, and infographics because when one resource fails, the error message is generic

## Root Cause Analysis

Looking at the save logic (lines 316-429):
- All valid resources are collected
- Existing resources are upserted in one batch call
- New resources are inserted in one batch call
- If ANY resource fails, the entire operation fails silently

## Solution: Individual Resource Save + Save All

### Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NEW SAVE ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Resource Card                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [Title Input] [Required Toggle]           [💾 Save] [🗑️ Delete]    │   │
│  │                                                                     │   │
│  │ Status: ● Saved ✓  |  ● Unsaved  |  ● Error ✗                      │   │
│  │                                                                     │   │
│  │ [Content Fields...]                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Bottom Bar                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Unsaved: 3  |  Errors: 1  |  Saved: 5     [Save All Unsaved]       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Add Save State Tracking

Add state to track each resource's save status:

```typescript
interface ResourceSaveState {
  status: 'saved' | 'unsaved' | 'saving' | 'error';
  error?: string;
  lastSavedAt?: Date;
}

const [saveStates, setSaveStates] = useState<Record<string, ResourceSaveState>>({});
```

#### 2. Individual Save Function

Create a function to save a single resource:

```typescript
const saveResource = async (resource: ModuleResource, index: number): Promise<boolean> => {
  const tempId = resource.id || `temp-${index}`;
  
  setSaveStates(prev => ({
    ...prev,
    [tempId]: { status: 'saving' }
  }));

  try {
    // Validate resource
    if (!resource.title?.trim()) {
      throw new Error("Title is required");
    }

    // Validate JSON for flashcards/ai_scenario
    if (resource.resource_type === 'flashcards' || resource.resource_type === 'ai_scenario') {
      if (!resource.resource_data || typeof resource.resource_data !== 'object') {
        throw new Error("Invalid JSON data");
      }
    }

    // Validate URL for video/slides/infographic
    if (['video', 'slides', 'infographic', 'mindmap', 'audio_podcast'].includes(resource.resource_type)) {
      if (!resource.resource_url?.trim()) {
        throw new Error("URL/File is required for this resource type");
      }
    }

    if (resource.id) {
      // Update existing
      const { error } = await supabase
        .from("module_resources")
        .update({
          title: resource.title,
          description: resource.description || null,
          resource_type: resource.resource_type,
          resource_url: resource.resource_url,
          resource_data: resource.resource_data,
          stage_number: resource.stage_number,
          display_order: resource.display_order,
          is_required: resource.is_required,
        })
        .eq('id', resource.id);
      
      if (error) throw error;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("module_resources")
        .insert({
          module_id: moduleId,
          title: resource.title,
          description: resource.description || null,
          resource_type: resource.resource_type,
          resource_url: resource.resource_url,
          resource_data: resource.resource_data,
          stage_number: resource.stage_number,
          display_order: resource.display_order,
          is_required: resource.is_required,
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Update local state with new ID
      const updated = [...resources];
      updated[index] = { ...updated[index], id: data.id };
      setResources(updated);
    }

    setSaveStates(prev => ({
      ...prev,
      [resource.id || `temp-${index}`]: { 
        status: 'saved',
        lastSavedAt: new Date()
      }
    }));
    
    toast.success(`"${resource.title}" saved successfully`);
    return true;
  } catch (error: any) {
    const errorMessage = error.message || "Failed to save resource";
    
    setSaveStates(prev => ({
      ...prev,
      [tempId]: { 
        status: 'error',
        error: errorMessage
      }
    }));
    
    toast.error(`Failed to save "${resource.title}": ${errorMessage}`);
    return false;
  }
};
```

#### 3. Track Unsaved Changes

Mark resources as unsaved when modified:

```typescript
const updateResource = (index: number, field: keyof ModuleResource, value: any) => {
  const updated = [...resources];
  updated[index] = { ...updated[index], [field]: value };
  setResources(updated);
  
  // Mark as unsaved
  const resourceId = updated[index].id || `temp-${index}`;
  setSaveStates(prev => ({
    ...prev,
    [resourceId]: { status: 'unsaved' }
  }));
};
```

#### 4. Save All Unsaved Function

Iterate through unsaved resources and save each individually:

```typescript
const saveAllUnsaved = async () => {
  setSaving(true);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const resourceId = resource.id || `temp-${i}`;
    const state = saveStates[resourceId];
    
    if (state?.status === 'unsaved' || !state) {
      const success = await saveResource(resource, i);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
  }
  
  if (errorCount === 0) {
    toast.success(`All ${successCount} resources saved successfully!`);
  } else {
    toast.warning(`Saved ${successCount} resources. ${errorCount} failed - check individual errors.`);
  }
  
  setSaving(false);
};
```

#### 5. Update Resource Card UI

Add save button and status indicator to each resource card:

```tsx
const renderResourceForm = (resource: ModuleResource, index: number) => {
  const globalIndex = resources.findIndex(r => r === resource);
  const resourceId = resource.id || `temp-${globalIndex}`;
  const saveState = saveStates[resourceId];
  
  return (
    <Card key={index} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{resourceTypeLabels[resource.resource_type]}</Badge>
            {resource.is_required && <Badge variant="destructive">Required</Badge>}
            {/* Save Status Badge */}
            {saveState?.status === 'saved' && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
            {saveState?.status === 'unsaved' && (
              <Badge variant="secondary">
                <Circle className="h-3 w-3 mr-1" />
                Unsaved
              </Badge>
            )}
            {saveState?.status === 'saving' && (
              <Badge variant="secondary">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </Badge>
            )}
            {saveState?.status === 'error' && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Individual Save Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => saveResource(resource, globalIndex)}
              disabled={saveState?.status === 'saving' || saveState?.status === 'saved'}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={() => removeResource(globalIndex)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        {/* Error Message Display */}
        {saveState?.status === 'error' && saveState.error && (
          <p className="text-sm text-destructive mt-2 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {saveState.error}
          </p>
        )}
      </CardHeader>
      {/* ... rest of form */}
    </Card>
  );
};
```

#### 6. Update Bottom Action Bar

Add summary and Save All button:

```tsx
{/* Summary Bar Before Save All Button */}
<div className="flex items-center gap-4">
  {(() => {
    const unsavedCount = resources.filter((r, i) => {
      const id = r.id || `temp-${i}`;
      return saveStates[id]?.status === 'unsaved' || !saveStates[id];
    }).length;
    const errorCount = resources.filter((r, i) => {
      const id = r.id || `temp-${i}`;
      return saveStates[id]?.status === 'error';
    }).length;
    const savedCount = resources.filter((r, i) => {
      const id = r.id || `temp-${i}`;
      return saveStates[id]?.status === 'saved';
    }).length;
    
    return (
      <>
        {unsavedCount > 0 && (
          <Badge variant="secondary">{unsavedCount} unsaved</Badge>
        )}
        {errorCount > 0 && (
          <Badge variant="destructive">{errorCount} with errors</Badge>
        )}
        {savedCount > 0 && (
          <Badge variant="outline" className="border-green-600 text-green-600">
            {savedCount} saved
          </Badge>
        )}
      </>
    );
  })()}
  <Button onClick={saveAllUnsaved} disabled={saving}>
    <Save className="h-4 w-4 mr-2" />
    {saving ? "Saving..." : "Save All Unsaved"}
  </Button>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ModuleResourcesManager.tsx` | Add save state tracking, individual save function, UI updates |

---

## Expected Outcomes

1. **Individual Save Buttons**: Each resource card has its own "Save" button
2. **Visual Status Indicators**: Clear badges showing Saved/Unsaved/Saving/Error
3. **Inline Error Messages**: Specific error shown on the resource that failed
4. **Summary Count**: Bottom bar shows count of unsaved/errored/saved resources
5. **Save All Unsaved**: Batch save only unsaved resources, with individual error tracking
6. **No Data Loss**: If JSON is invalid, the specific resource shows the error and others can still be saved

---

## Validation Improvements

Add specific validation for each resource type before saving:

| Resource Type | Validation |
|---------------|------------|
| `video` | Must have valid YouTube URL |
| `slides` | Must have PDF file uploaded |
| `infographic`/`mindmap` | Must have image file uploaded |
| `audio_podcast` | Must have audio file uploaded |
| `flashcards` | Must have valid JSON with cards array |
| `ai_scenario` | Must have valid JSON with scenarios array |
| `quiz` | No URL/data required (managed separately) |
| `report` | Must have content in resource_data |

