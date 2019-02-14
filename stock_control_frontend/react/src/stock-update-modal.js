import React from 'react';
import './css/stock-update-modal.css';
import Modal from "react-modal";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'

Modal.setAppElement(document.body);

const REGULAR_STYLES = {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#001e00',
    color: 'yellow',
    border: '1px solid yellow',
    borderRadius: '7px 7px 7px 7px',
    boxShadow: '-7px -7px 17px 7px #001e00',
    maxWidth: '800px',
};

const DANGER_STYLES = {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'darkred',
    color: 'white',
    border: '1px solid yellow',
    borderRadius: '7px 7px 7px 7px',
    boxShadow: '-7px -7px 17px 7px #001e00',
    maxWidth: '800px'
};

class StockUpdateModal extends React.Component {

    constructor(props) {
        super(props);
        this.initialState = {
            stockUpdateMeta: null,
            modalIsOpen: false,
            id: null,
            units_total: 0,
            unit_price: 0.00,
            desc: '',
            sku: '',
            unitsToTransfer: 0,
            startUnitsTotal: 0,
            newRecord: false,
            deleteRecord: false,
            modalStyles: {content: REGULAR_STYLES},
        };
        this.state = {...this.initialState};  // COPY of initialState
        // Remember! This binding is necessary to make `this` work in the callback
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleAfterOpenModal = this.handleAfterOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
    }

    componentWillMount() {
    }

    componentWillUnmount() {
    }

    componentWillReceiveProps(nextProps) {
        this.setState({
            stockUpdateMeta: nextProps.stockUpdateMeta,
            id: nextProps.stockUpdateData.id,
            units_total: nextProps.stockUpdateData.units_total,
            unit_price: nextProps.stockUpdateData.unit_price,
            sku: nextProps.stockUpdateData.sku,
            desc: nextProps.stockUpdateData.desc,
            newRecord: nextProps.stockUpdateMeta.newRecord,
            deleteRecord: nextProps.stockUpdateMeta.deleteRecord
        });
        nextProps.stockUpdateMeta.deleteRecord ? this.setState({modalStyles: {content: DANGER_STYLES}}) :
            this.setState({modalStyles: {content: REGULAR_STYLES}});
        // if signal to open modal, open it
        if (nextProps.openStockUpdateModal) {
            this.handleOpenModal({transferLimit: nextProps.stockUpdateData.units_total});
        }
    }

    handleOpenModal({transferLimit} = {}) {
        this.setState({modalIsOpen: true, startUnitsTotal: transferLimit});
    }

    handleAfterOpenModal() {
        // this.subtitle.style.color = 'yellow';
    }

    handleCloseModal({actionCancelled = false} = {}) {
        // first clear temp values from component state
        this.setState({...this.initialState});
        // set modal state in index.js back to closed
        this.props.setStockUpdateModalState({state: false, actionCancelled: actionCancelled});
    }

    handleRecordUpdate() {
        /*
        method to update record data (cancel if desc or sku fields were empty)
         */
        let {units_total, unitsToTransfer, unit_price, sku, desc, newRecord} = this.state;
        let reqFieldsComplete = !!(desc && sku);  // these fields required to have a value
        if (reqFieldsComplete) {
            this.props.setStockUpdateRecordState({
                record: {
                    data: {
                        units_total: !isNaN(parseInt(units_total)) ? units_total : 0,
                        unit_price: unit_price,
                        sku: sku,
                        desc: desc,
                        units_to_transfer: !isNaN(parseInt(unitsToTransfer)) ? unitsToTransfer : 0
                    },
                    meta: {
                        url: `${process.env.REACT_APP_API_DATA_ROUTE}/stock/`
                    }
                },
                apiMode: newRecord ?
                    this.props.apiOptions.ADD_STOCK : this.props.apiOptions.PATCH_STOCK
            });
        }
        this.handleCloseModal({actionCancelled: !reqFieldsComplete});
    }

    handleEnterKey(e) {
        if (e.keyCode === 13) {
            /* e.preventDefault() required to prevent registering "Enter" and
             and submitting the form twice. Does not register first time if not
             explicitly testing for keycode, as onChange does not record
             "Enter" as a keystroke, however testing onKeyDown does.
             */
            e.preventDefault();
            this.handleRecordUpdate();  // submit immediately if Enter pressed
        }
    }

    handleRecordDelete() {
        /*
        method to handle deletion of a stock line (record)
         */
        this.props.setStockUpdateRecordState({
            record: {
                meta: {
                    url: `${process.env.REACT_APP_API_DATA_ROUTE}/stock/${this.state.id}`
                }
            },
            apiMode: this.props.apiOptions.DELETE_STOCK_LINE
        });
        this.handleCloseModal();
    }


    validatePrice(value) {
        return (/^[\d]*[.]?[\d]{0,2}$/.test(value)) ? value : this.state.unit_price
    }

    validateDesc(value) {
        return (/^[a-zA-Z\d.\- ]*$/.test(value)) ? value : this.state.desc
    }

    generateItemTable() {
        let editDisabled = true;
        //note: if newRecord, no userIsAdmin state has been set, hence need to test for newRecord separately
        if (this.state.stockUpdateMeta.userIsAdmin || this.state.stockUpdateMeta.newRecord) {
            editDisabled = false
        }
        // true|false. Disable submit if input for units was blank
        let disableButton = this.state.units_total === '' || this.state.unitsToTransfer === '';
        return (
            <div className={'container'}>
                <div className={'row'}>
                    <div className="col-sm">
                        <table className={`table stockTable${editDisabled ? "-disabled" : ''}
                        table-bordered table-dark table-hover`}>
                            <caption>Current Record</caption>
                            <thead>
                            <tr>
                                <th scope={'col'}>Stock Attribute</th>
                                <th scope={'col'}>Value</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr>
                                <th scope={'row'}><label>SKU</label></th>
                                <td>
                                    <input value={this.state.sku}
                                           name={'sku'}
                                           onChange={e => this.setState({sku: e.target.value})}
                                           className={'form-control'} type={'text'}
                                           disabled={editDisabled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <th scope={'row'}><label>Description</label></th>
                                <td>
                                    <input value={this.state.desc}
                                           name={'description'}
                                           onChange={e => this.setState({desc: this.validateDesc(e.target.value)})}
                                           className={'form-control'} type={'text'}
                                           disabled={editDisabled}/>
                                </td>
                            </tr>
                            <tr>
                                <th scope={'row'}><label>Warehouse quantity</label></th>
                                <td>
                                    <input value={!editDisabled ? this.state.units_total : this.state.startUnitsTotal}
                                           name={'quantity'}
                                           onKeyDown={(e => !disableButton ? this.handleEnterKey(e) : null)}
                                           onChange={e => {
                                               if (parseInt(e.target.value) >= 0) {
                                                   return this.setState({
                                                       units_total: parseInt(e.target.value)
                                                   });
                                               }
                                               return this.setState({units_total: ''})
                                           }}
                                           className={'form-control'} type={'text'}
                                           disabled={editDisabled} autoFocus={true}/>
                                </td>
                            </tr>
                            <tr>
                                <th scope={'row'}><label>Unit price</label></th>
                                <td>
                                    <input value={this.state.unit_price}
                                           name={'unit-price'}
                                           onChange={e => this.setState({
                                               unit_price:
                                                   this.validatePrice(e.target.value)
                                           })}
                                           className={'form-control'} type={'text'}
                                           disabled={editDisabled}
                                    />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                        <div className={!editDisabled ? 'd-none' : 'row transfer'}>
                            <div className={'col-sm'}>
                                Units to Transfer
                            </div>
                            <div className={'col-sm'}>
                                <input value={this.state.unitsToTransfer}
                                       name={'quantity'}
                                       onKeyDown={(e => !disableButton ? this.handleEnterKey(e) : null)}
                                       onChange={e => {
                                           if (parseInt(e.target.value) > 0 &&
                                               parseInt(e.target.value) <= this.state.startUnitsTotal) {
                                               return this.setState({
                                                   unitsToTransfer: parseInt(e.target.value),
                                                   units_total: this.state.startUnitsTotal - parseInt(e.target.value)
                                               });
                                           }
                                           return this.setState({unitsToTransfer: ''})
                                       }
                                       }
                                       className={'form-control'} autoFocus={true}/>
                            </div>
                            <div className={'col-sm'}>
                                <button className={'btn btn-lg btn-warning qtybtn'} onClick={() => {
                                    if (this.state.units_total > 0) {
                                        this.setState({
                                            units_total: this.state.units_total - 1,
                                            unitsToTransfer: this.state.unitsToTransfer + 1
                                        })
                                    }
                                }}><FontAwesomeIcon icon={"plus-square"}/>
                                </button>
                                <button className={'btn btn-lg btn-warning qtybtn'} onClick={() => {
                                    if (this.state.units_total >= 0 && this.state.units_total
                                        < this.state.startUnitsTotal) {
                                        this.setState({
                                            units_total: this.state.units_total + 1,
                                            unitsToTransfer: this.state.unitsToTransfer ?
                                                this.state.unitsToTransfer - 1 : 0
                                        })
                                    }
                                }}><FontAwesomeIcon icon={"minus-square"}/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={'row'}>
                    <div className={'col-sm xfer-button'}>
                        <button
                            onClick={(e) => {
                                if (!disableButton) {
                                    e.preventDefault();
                                    this.handleRecordUpdate()
                                }
                            }}
                            className={'btn btn-lg btn-warning pull-right'}
                            disabled={disableButton}
                        >
                            {this.state.newRecord ?
                                'New Stock Item' : editDisabled ? 'Transfer Now!' : 'Edit Stock Record'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    generateEditForm() {
        if (this.state.stockUpdateMeta.deleteRecord) {
            return (
                <div className={'container'}>
                    <div className={'row'}>
                        <h4>Delete "{this.state.desc}"</h4>
                        <form className={'form-control transfer-form-danger'}>
                            <label>Confirm deletion of "{this.state.desc}" (SKU: {this.state.sku})
                                from the database:</label>
                            <div className={'btn-group-justified'}>
                                <button
                                    onClick={(e) => {
                                        this.handleRecordDelete();
                                    }}
                                    className={'delete-btn btn btn-danger'}>Yes, delete!
                                </button>
                                <button
                                    onClick={(e) => {
                                        this.handleCloseModal({actionCancelled: true});
                                    }}
                                    className={'cancel-btn btn btn-secondary'}>No, CANCEL!
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
        }
        return this.generateItemTable();  // return as default unless deleting record content already returned
    }

    render() {
        if (this.state.stockUpdateMeta) {
            return (
                <Modal
                    isOpen={this.state.modalIsOpen}
                    onAfterOpen={this.handleAfterOpenModal}
                    onRequestClose={this.handleCloseModal}
                    style={this.state.modalStyles}
                    contentLabel="Stock Action"
                >
                    <div className="container">
                        <div className="row">
                            <div className="col-sm">
                                <h2 ref={subtitle => this.subtitle = subtitle}>Manage Stock</h2>
                            </div>
                            <div className="col-sm close-modal-button-cell">
                                <button className="btn btn btn-outline-light close-button"
                                        onClick={() => {
                                            this.handleCloseModal({actionCancelled: true})
                                        }}>Cancel
                                </button>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-sm">
                                {this.generateEditForm()}
                            </div>
                        </div>
                    </div>
                </Modal>
            );
        } else {
            return (
                <div></div>
            )
        }
    }
}

export default StockUpdateModal;