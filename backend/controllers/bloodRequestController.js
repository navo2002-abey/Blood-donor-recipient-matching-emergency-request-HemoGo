const BloodRequest = require('../models/BloodRequest');

exports.createBloodRequest = async (req, res) => {
  try {
    const {
      patientName,
      hospital,
      bloodGroup,
      units,
      requiredDateTime,
      urgency,
      additionalInfo,
    } = req.body;

    if (!patientName || !hospital || !bloodGroup || !units || !requiredDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all mandatory fields.',
      });
    }

    const newRequest = await BloodRequest.create({
      patientName,
      hospital,
      bloodGroup,
      units: Number(units),
      requiredDateTime,
      urgency: urgency || 'Medium',
      additionalInfo: additionalInfo || '',
      requestedBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Blood request created successfully!',
      data: newRequest,
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create blood request.',
    });
  }
};

exports.getBloodRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.urgency) {
      filter.urgency = req.query.urgency;
    }
    if (req.query.bloodGroup) {
      filter.bloodGroup = req.query.bloodGroup;
    }
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.my === 'true' && req.user?._id) {
      filter.requestedBy = req.user._id;
    } else if (req.query.requestedBy) {
      filter.requestedBy = req.query.requestedBy;
    }

    const requests = await BloodRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('requestedBy', 'name email phone')
      .populate('acceptedBy', 'name email phone')
      .populate('verifiedBy', 'name email phone');

    return res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    console.error('Error getting blood requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve blood requests.',
    });
  }
};

exports.getBloodRequestById = async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id)
      .populate('requestedBy', 'name email phone')
      .populate('acceptedBy', 'name email phone')
      .populate('verifiedBy', 'name email phone');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }
    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Error fetching blood request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve blood request details.',
    });
  }
};

exports.updateBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patientName,
      hospital,
      bloodGroup,
      units,
      requiredDateTime,
      urgency,
      additionalInfo,
      status,
    } = req.body;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }

    // Authorization check: Only owner or admin can update
    if (
      req.user &&
      request.requestedBy &&
      req.user.role !== 'ADMIN' &&
      request.requestedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to edit blood requests posted by others.',
      });
    }

    if (patientName !== undefined) request.patientName = patientName;
    if (hospital !== undefined) request.hospital = hospital;
    if (bloodGroup !== undefined) request.bloodGroup = bloodGroup;
    if (units !== undefined) request.units = Number(units);
    if (requiredDateTime !== undefined) request.requiredDateTime = requiredDateTime;
    if (urgency !== undefined) request.urgency = urgency;
    if (additionalInfo !== undefined) request.additionalInfo = additionalInfo;
    if (status !== undefined) request.status = status;

    const updated = await request.save();

    return res.status(200).json({
      success: true,
      message: 'Blood request updated successfully!',
      data: updated,
    });
  } catch (error) {
    console.error('Error updating blood request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update blood request.',
    });
  }
};

exports.deleteBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found or already deleted.',
      });
    }

    // Authorization check: Only owner or admin can delete
    if (
      req.user &&
      request.requestedBy &&
      req.user.role !== 'ADMIN' &&
      request.requestedBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete blood requests posted by others.',
      });
    }

    await BloodRequest.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Blood request deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting blood request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete blood request.',
    });
  }
};

exports.acceptBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await BloodRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }

    if (request.status === 'VERIFIED' || request.status === 'FULFILLED') {
      return res.status(200).json({
        success: true,
        message: 'Blood request is already verified/completed.',
        data: request,
      });
    }

    request.status = 'ACCEPTED';
    if (!request.acceptedAt) {
      request.acceptedAt = new Date();
    }
    if (req.user?._id) {
      request.acceptedBy = req.user._id;
    }

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Blood request accepted successfully.',
      data: request,
    });
  } catch (error) {
    console.error('Error accepting blood request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept blood request.',
    });
  }
};

exports.verifyBloodRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { verifierId } = req.body;

    const request = await BloodRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found.',
      });
    }

    const currentFulfilled = request.fulfilledUnits || 0;
    const nextFulfilled = currentFulfilled + 1;
    const totalRequired = request.units || 1;

    request.fulfilledUnits = Math.min(totalRequired, nextFulfilled);
    if (request.fulfilledUnits >= totalRequired) {
      request.status = 'VERIFIED';
    } else {
      request.status = 'IN_PROGRESS';
    }

    request.verifiedAt = new Date();
    if (!request.acceptedAt) {
      request.acceptedAt = new Date(Date.now() - 60000);
    }
    if (verifierId) request.verifierId = verifierId;
    if (req.user?._id) request.verifiedBy = req.user._id;

    await request.save();

    return res.status(200).json({
      success: true,
      message: 'Blood donation verified successfully by hospital!',
      data: request,
    });
  } catch (error) {
    console.error('Error verifying blood request:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify blood request.',
    });
  }
};
