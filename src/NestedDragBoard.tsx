import {DragContainer, Draggable, Handler, OrderChangeEvent} from 'react-legato-dnd'
import { useEffect, useRef, useState} from 'react'

interface ItemType {
    name: string,
    groups?: [number, number][],
    children?: ItemType[]
}

export default function NestedDragBoard() {
    const [items, setItems] = useState<ItemType[]>([
        {
            name: 'AAAAAAAA', children: [
                {name: 'Angela'},
                {name: 'Bob'},
                {name: 'Candy'},
                {name: 'Duke'},
                {name: 'Eve'},
                {name: 'Far'},
            ],
            groups: [[0, 3], [2, 3]],
        },
        {
            name: 'B', children: [
                {name: 'Angela'},
                {name: 'Bob'},
                {name: 'Candy'},
            ],
        },
        {
            name: 'C', children: [
                {name: 'Angela'},
                {name: 'Bob'},
                {name: 'Candy'},
            ],
        },

    ])
    const ref = useRef(items)
    useEffect(() => {
        ref.current = items
    })

    const onOuterChange = ({order}: OrderChangeEvent) => {
        const newItems = order.map(i => ref.current[i])
        console.log('newItems', newItems)
        setItems(newItems)
    }
    const onInnerChange = ({order}: OrderChangeEvent, i: number) => {
        const outItems = [...ref.current]
        console.log('outItems', i, outItems.map(t => t.name))
        const children = outItems[i].children
        if (children) {
            outItems[i].children = order.map(i => children[i])

            setItems(outItems)
        }

    }

    const onMouseDown = () => {
        console.log('onMousedown')
    }
    return (
        <div style={{maxWidth: '1000px', margin: 'auto', marginTop: '100px', height: '200px', overflow: 'auto'}}>
            <DragContainer lockCrossAxis onOrderChange={onOuterChange}>
                {items.map(({name, children, groups}, i) => (
                    <Draggable key={name + '-' + i} handler={false}>
                        <div onMouseDown={onMouseDown} style={{backgroundColor: '#f2f2f2', display: 'flex'}}>
                            <Handler>
                                <div>Handler{name}</div>
                            </Handler>
                            {children && children.length && (
                                <DragContainer
                                    groups={groups}
                                    lockCrossAxis vertical
                                    onOrderChange={e => onInnerChange(e, i)}>
                                    {children.map(({name}) => (
                                        <Draggable key={name} handler={false}>
                                            <div style={{width: '500px', height: '48px', display: 'flex'}}>
                                                <Handler>
                                                    <div style={{height: '100px'}}>Handler</div>
                                                </Handler>
                                                <input/>
                                                <div>{name}</div>
                                            </div>
                                        </Draggable>
                                    ))}
                                </DragContainer>
                            )}
                        </div>
                    </Draggable>
                ))}
            </DragContainer>
        </div>
    )

}
