package software.felipe.jellytabs

import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class JellyTabsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ReactNativeJellyTabs")

    View(JellyTabBarView::class) {
      Events("onTabPress", "onTabLongPress")

      Prop("tabs") { view: JellyTabBarView, tabs: ReadableArray -> view.setTabs(tabs.toTabs()) }
      Prop("selectedIndex") { view: JellyTabBarView, index: Int -> view.setSelectedIndex(index) }
      Prop("palette") { view: JellyTabBarView, palette: ReadableMap -> view.setPalette(palette.toPalette()) }
      Prop("layerOpacity") { view: JellyTabBarView, opacity: ReadableMap -> view.setLayerOpacity(opacity.toLayerOpacity()) }
      Prop("metrics") { view: JellyTabBarView, metrics: ReadableMap -> view.setMetrics(metrics.toMetrics()) }
      Prop("motion") { view: JellyTabBarView, motion: ReadableMap -> view.setMotionConfig(motion.toMotionConfig()) }
      Prop("touchFeedback") { view: JellyTabBarView, feedback: ReadableMap -> view.setTouchFeedback(feedback.toTouchFeedback()) }
      Prop("recording") { view: JellyTabBarView, recording: Boolean -> view.setRecording(recording) }
      Prop("longPressEnabled") { view: JellyTabBarView, enabled: Boolean -> view.setLongPressEnabled(enabled) }

      AsyncFunction("activate") { view: JellyTabBarView, index: Int -> view.activate(index) }
      AsyncFunction("restore") { view: JellyTabBarView, index: Int -> view.restore(index) }

      GroupView<JellyTabBarView> {
        AddChildView { parent, child: View, index -> parent.addReactChild(child, index) }
        GetChildCount { parent -> parent.reactChildCount }
        GetChildViewAt { parent, index -> parent.reactChildAt(index) }
        RemoveChildView { parent, child: View -> parent.removeReactChild(child) }
        RemoveChildViewAt { parent, index -> parent.removeReactChildAt(index) }
      }

      OnViewDidUpdateProps { view: JellyTabBarView -> view.commit() }

      OnViewDestroys { view: JellyTabBarView -> view.release() }
    }
  }
}
