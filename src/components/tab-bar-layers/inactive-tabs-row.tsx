import { ABSOLUTE_FILL, cloneTabs, type TabElements } from "./shared";
import { StyleSheet, View } from "react-native";

export interface InactiveTabsRowProps {
    tabs: TabElements;
    trackInset: number;
}

export const InactiveTabsRow = ({ tabs, trackInset }: InactiveTabsRowProps) => (
    <View style={[styles.tabsRow, { paddingHorizontal: trackInset }]}>
        {cloneTabs(tabs, "inactive")}
    </View>
);

const styles = StyleSheet.create({
    tabsRow: {
        ...ABSOLUTE_FILL,
        alignItems: "center",
        flexDirection: "row",
    },
});
