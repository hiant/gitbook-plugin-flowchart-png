# gitbook-plugin-flowchart-png

使用 flowchart.js 生成svg，使用phantomjs进行截屏

## 使用说明

1. 在 book.json 中添加
  
  ```
  {
      plugins: ["flowchart-png@git+https://github.com/hiant/gitbook-plugin-flowchart-png.git"]
  }
  ```
2. 安装插件

  `$gitbook install`

## 语法说明

    ```flowchart
    st=>start: Start|past
    e=>end: End
    op1=>operation: My Operation|past
    op2=>operation: Stuff|current
    sub1=>subroutine: My Subroutine|invalid
    cond=>condition: Yes 
    or No?|approved
    c2=>condition: Good idea|rejected
    io=>inputoutput: catch something...|request

    st->op1(right)->cond
    cond(yes, right)->c2
    cond(no)->sub1(left)->op1
    c2(yes)->io->e
    c2(no)->op2->e
    ```
### 定义元素

语法是：tag=>type: content:>url 
* tag：标签名，整个流程图需要唯一，在连接元素时用 
* type：标签类型，有6种类型：
  * start 
  * end 
  * operation 
  * subroutine 
  * condition 
  * inputoutput
* content：标签显示的文本，**需要注意：**，type后的冒号与文本之间一定要有个空格 
* url：连接，与框框中的文本相绑定。**需要注意：**由于是生成的图片，这个url其实是没有效果的

### 连接元素

直接用->来连接两个元素，需要注意的是condition类型，因为他有yes和no两个分支，所以要写成

```
c2(yes)->io->e
c2(no)->op2->e
```
