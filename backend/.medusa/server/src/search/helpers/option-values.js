"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toOptionValues = toOptionValues;
/**
 * Flattens a product's options into `"<option title>:<value>"` entries, e.g.
 * `["Size:S", "Color:Red"]`. One field keeps the index simple; the storefront
 * splits on the first `:` to group the facet by option name.
 */
function toOptionValues(options) {
    const flattened = (options ?? []).flatMap((option) => {
        const title = option?.title?.trim();
        if (!title) {
            return [];
        }
        return (option?.values ?? [])
            .map((optionValue) => optionValue?.value?.trim())
            .filter((value) => Boolean(value))
            .map((value) => `${title}:${value}`);
    });
    // A value shared by several options would otherwise be counted twice.
    return Array.from(new Set(flattened));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9uLXZhbHVlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9zZWFyY2gvaGVscGVycy9vcHRpb24tdmFsdWVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBVUEsd0NBa0JDO0FBdkJEOzs7O0dBSUc7QUFDSCxTQUFnQixjQUFjLENBQzVCLE9BQThDO0lBRTlDLE1BQU0sU0FBUyxHQUFHLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ25ELE1BQU0sS0FBSyxHQUFHLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFFcEMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ1gsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDO1FBRUQsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLElBQUksRUFBRSxDQUFDO2FBQzFCLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQzthQUNoRCxNQUFNLENBQUMsQ0FBQyxLQUFLLEVBQW1CLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDbEQsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEtBQUssSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLENBQUMsQ0FBQyxDQUFDO0lBRUgsc0VBQXNFO0lBQ3RFLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUMifQ==