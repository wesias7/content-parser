import { mergeObjects } from '@ridi/parser-core';

import CssItem from './CssItem';

class InlineCssItem extends CssItem {
  constructor(rawObj = {}, freeze = true) {
    super(rawObj, freeze);
    this.style = rawObj.style || '';
    /* istanbul ignore else: untestable */
    if (freeze) {
      Object.freeze(this);
    }
  }

  toRaw() {
    return mergeObjects(super.toRaw(), {
      style: this.style,
      itemType: InlineCssItem.name,
    });
  }
}

export default InlineCssItem;
