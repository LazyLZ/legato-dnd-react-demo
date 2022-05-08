import {MouseEvent, BaseSyntheticEvent, useEffect, useRef, useState, useContext, useMemo, useCallback} from 'react'
import classes from './AppTabs.module.less'
// import {ReactComponent as CloseIcon} from '@mdi/svg/svg/close.svg'
// import {ReactComponent as CloseCircleIcon} from '@mdi/svg/svg/close-circle-outline.svg'
import {DragContainer, Draggable, DragCrossEvent, OrderChangeEvent, DISABLED_CLASS} from 'react-legato-dnd'
import {joinClass} from './utils'


// Fixme 关闭tab时产生Layout shift，并且性能低下
// Fixme 关闭tab时产生大量rerender，从KeepAliveOutlet开始
// Fixme 点击视口外的tab，滚动时active的tab触发了transition，导致脱离了文档流，导致移动滞后
// Fixme divider有1px问题，对不准

const TRANSITION_DURATION = 200
const containerPadding = 8

export interface AppTabsProps {
    beforeRedirectToHome?: () => void
}

export interface IAppTab {
    id: number,
    text: string,
    subText: string,
}

const getId = (function () {
    let i = 0
    return function () {
        i += 1
        return i
    }
})()

const initTabs: IAppTab[] = [
    {id: getId(), text: '百度一下，你就知道', subText: 'www.baidu.com'},
    {id: getId(), text: '8. 字符串转换整数 (atoi) - 力扣（LeetCode）', subText: ''},
    {id: getId(), text: 'ScholarOne Manuscripts', subText: ''},
    {id: getId(), text: '网易邮箱6.0版', subText: 'mail.126.com'},
    {id: getId(), text: '电子科技大学安全教育平台', subText: ''},
    {id: getId(), text: '动态首页-哔哩哔哩', subText: ''},
]
export default function AppTabs({beforeRedirectToHome}: AppTabsProps) {

    // tab State
    const [tabs, setTabs] = useState<IAppTab[]>(initTabs)

    const [orderMap, setOrderMap] = useState<Map<number, number> | null>(null)
    const [activeId, setActiveId] = useState(0)
    const activeIndex = useMemo(() => {
        return tabs.findIndex(t => t.id === activeId)
    }, [activeId, tabs])

    const focus = useCallback((id: number) => {
        const tab = tabs.find(t => t.id === id)
        if (tab) {
            setActiveId(id)
        }
    }, [tabs])

    // ref & others
    const [widths, setWidths] = useState({content: 0, container: 0})
    const [scrollSize, setScrollSize] = useState(0)
    const tabsRef = useRef(tabs)
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const activeElRef = useRef(null as null | HTMLDivElement)

    const [breakpoint, setBreakpoint] = useState({})
    useEffect(() => {
        let tid: ReturnType<typeof setTimeout>
        const onResize = () => {
            clearTimeout(tid)
            tid = setTimeout(() => {
                setBreakpoint({})
            }, 200)
        }
        window.addEventListener('resize', onResize, {passive: true})

        return () => {
            window.removeEventListener('resize', onResize)
        }
    }, [])


    // 获取实时ref
    useEffect(() => {
        tabsRef.current = tabs
    })

    // 监听宽度变化
    useEffect(() => {
        if (!containerRef.current || !contentRef.current) return
        setWidths({
            content: contentRef.current.offsetWidth,
            container: containerRef.current.offsetWidth,
        })
        // console.log('setWidth', containerRef.current.offsetWidth)
    }, [tabs, contentRef.current, containerRef.current, breakpoint])

    // 获取当前active的tab的dom
    const setActiveRef = (ref: HTMLDivElement | null, id: IAppTab['id']) => {
        if (activeId) {
            if (ref && id === activeId) {
                activeElRef.current = ref
                // console.log('getActive', activeElRef.current)
            }
        } else {
            activeElRef.current = null
        }
    }
    // 若activeTab不在视口，自动滚动到视口
    useEffect(() => {
        if (!containerRef.current || !activeElRef.current) return
        const containerRect = containerRef.current.getBoundingClientRect()
        const activeRect = activeElRef.current.getBoundingClientRect()
        if (!activeRect.width) return
        const dRight = activeRect.right - (containerRect.right - containerPadding)
        const dLeft = activeRect.left - (containerRect.left + containerPadding)
        // console.log('activePositionChange', activeElRef.current, containerRef.current, activeRect, containerRect, dRight, dLeft)
        if (dRight >= 1 || dLeft <= -1) {
            // console.log('scroll Right side', dRight, dLeft)
            const size = dRight > 0 ? dRight : dLeft
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.scrollBy({
                        left: Math.round(size),
                        behavior: 'smooth',
                    })
                    console.log('autoScroll')
                }
            }, TRANSITION_DURATION)
        }
    }, [activeId, tabs, breakpoint])

    // const [lastAddIndex, setLastAddIndex] = useState(-1)


    // 点击
    const onClickTab = (t: IAppTab) => {
        focus(t.id)
    }
    const onClickOuterTab = (t: IAppTab) => {
        focus(t.id)
    }
    // console.log('refresh', closedTabs)
    const onOrderChange = ({order}: OrderChangeEvent) => {
        // console.log('change', newItems.map(t => t.name))
        // console.log('on order change', order)
        const newItems = order.map(i => tabsRef.current[i])
        setTabs(newItems)
    }
    const onDragEnd = () => {
        setOrderMap(null)
    }
    const onDragCross = ({order}: DragCrossEvent) => {
        // console.log('order', order)
        const map = new Map<number, number>()
        order.forEach((idx, i) => {
            map.set(idx, i)
        })
        setOrderMap(map)
    }
    const onTabScroll = (e: BaseSyntheticEvent) => {
        window.requestAnimationFrame(() => {
            setScrollSize(e.target.scrollLeft)
        })
    }
    // e.p. 有可能content一直是 9.4, container是10
    const hasLeftShadow = Math.floor(widths.content) > Math.ceil(widths.container) && !!Math.floor(scrollSize)
    const hasRightShadow = Math.floor(widths.content) > Math.ceil(widths.container + scrollSize)
    // console.log('render AppTabs', widths.container + scrollSize, widths.content)

    const renderTab = (t: IAppTab, i: number) => {
        // console.log('render active', activeId)
        return (
            <div
                ref={ref => setActiveRef(ref, t.id)}
                onMouseDown={() => onClickTab(t)}
                onTouchStart={() => onClickTab(t)}
                onClick={() => onClickOuterTab(t)}
                onTouchEnd={() => onClickOuterTab(t)}
                className={joinClass(
                    classes.tab,
                    activeId === t.id && classes['tab--active'],
                )}
            >
                <div className={classes['clip--left']}/>
                <div className={classes.tabContent}>
                    <div className={classes.textTruncate}>
                        <span className={classes.text}>{t.text}</span>
                        {t.subText &&
                        <span className={classes.subText}>{t.subText}</span>}
                    </div>
                </div>
                <div className={classes['clip--right']}/>
            </div>
        )
    }
    return (
        <div className={classes.appTabs}>
            <div className={classes.tabContainer}>
                <div className={classes.tabScrollParent}>
                    <div className={joinClass(
                        classes.tabScrollShadow,
                        classes['tabScrollShadow--left'],
                        hasLeftShadow && classes['tabScrollShadow--active'],
                    )}/>
                    <div onScroll={onTabScroll} ref={containerRef} className={classes.tabScrollWrapper}>
                        <DragContainer
                            lockArea
                            ref={contentRef}
                            onDragCross={onDragCross}
                            style={{
                                paddingLeft: containerPadding + 'px',
                                paddingRight: containerPadding + 'px',
                            }}
                            onDragEnd={onDragEnd}
                            onOrderChange={onOrderChange}
                            className={classes.tabLayout}
                        >
                            {tabs.map((t, i) => {
                                const currentI = orderMap ? orderMap.get(i) : i
                                const currentActiveIndex = orderMap ? orderMap.get(activeIndex) : activeIndex
                                const needLeftDivider = currentI !== 0
                                const needRightDivider = (currentI === tabs.length - 1 || currentI === (currentActiveIndex || 0) - 1)
                                // console.log('get', i , currentI)
                                return (
                                    <Draggable key={`$${t.id}-${activeId}`} className={classes.draggable}>
                                        {needLeftDivider &&
                                        <div
                                            className={joinClass(classes.tabDivider, classes['tabDivider-left'])}
                                        />}

                                        {renderTab(t, currentI || 0)}

                                        {needRightDivider && (
                                            <div
                                                className={[classes.tabDivider, classes['tabDivider-right']].join(' ')}/>
                                        )}
                                    </Draggable>
                                )
                            })}
                        </DragContainer>
                    </div>
                    <div className={joinClass(
                        classes.tabScrollShadow,
                        classes['tabScrollShadow--right'],
                        hasRightShadow && classes['tabScrollShadow--active'],
                    )}/>
                </div>
            </div>
        </div>
    )
}
